package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run converter.go <epub_file>")
		return
	}

	fmt.Println(os.Args[1])

	epubFilePath := os.Args[1]

	// Check if the file exists
	if _, err := os.Stat(epubFilePath); os.IsNotExist(err) {
		fmt.Printf("Error: File '%s' not found.\n", epubFilePath)
		fmt.Println(err)
		return
	}

	// 1. Create a copy of the epub file
	// get the name of the file without the path
	fileName := filepath.Base(epubFilePath)	
	copyFile(epubFilePath, fileName)

	// 2. Change the extension to .zip
	zipFilePath := strings.TrimSuffix(fileName, ".epub") + ".zip"
	err := convertEpubToZip(fileName, zipFilePath)
	if err != nil {
		fmt.Println("Error converting to zip:", err)
		return
	}

	// 3. Unzip the book
	unzipDir, err := unzipFile(zipFilePath)
	if err != nil {
		fmt.Println("Error unzipping:", err)
		return
	}

	// 4-9. Extract and print book information
	bookInfo, err := getBookInfo(unzipDir, fileName)
	if err != nil {
		fmt.Println("Error getting book info:", err)
		return
	}


	deleteFile(zipFilePath)
	moveFile(fileName, unzipDir+"/"+fileName)

	fmt.Printf("%+v\n", bookInfo)

}

func deleteFile(filePath string) error {
	return os.Remove(filePath)
}

func moveFile(src, dst string) error {
	return os.Rename(src, dst)
}

func copyFile(src, dst string) error {
	sourceFileStat, err := os.Stat(src)
	if err != nil {
		return err
	}

	if !sourceFileStat.Mode().IsRegular() {
		return fmt.Errorf("%s is not a regular file", src)
	}

	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	destination, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destination.Close()

	_, err = io.Copy(destination, source)
	if err != nil {
		return err
	}

	return nil
}

func convertEpubToZip(epubPath, zipPath string) error {
	copyFile(epubPath, zipPath+"-copy")
	return os.Rename(zipPath+"-copy", zipPath)
}

func unzipFile(zipPath string) (string, error) {
	// Create a temporary directory for unzipping
	tempDir := strings.TrimSuffix(zipPath, ".zip")
	err := os.MkdirAll(tempDir, os.ModePerm)
	if err != nil {
		return "", err
	} // Clean up the temporary directory

	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(tempDir, f.Name)
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return "", err
		}

		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return "", err
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		_, err = io.Copy(outFile, rc)
		if err != nil {
			return "", err
		}
		outFile.Close()
		rc.Close()
	}

	return tempDir, nil
}

func getBookInfo(epubPath, fileName string) (string, error) {
	// Construct the path to container.xml
	unzipDir := strings.TrimSuffix(epubPath, ".zip")
	containerPath := filepath.Join(unzipDir, "META-INF", "container.xml")

	// Read container.xml
	containerContent, err := os.ReadFile(containerPath)
	if err != nil {
		return "", fmt.Errorf("error reading container.xml: %w", err)
	}

	// Regular expression to extract the full-path attribute
	re := regexp.MustCompile(`full-path="([^"]+)"`)
	match := re.FindStringSubmatch(string(containerContent))
	if len(match) != 2 {
		return "", fmt.Errorf("error finding opf path in container.xml")
	}
	opfPath := match[1]

	// Construct the path to opf
	opfPath = filepath.Join(unzipDir, opfPath)

	// Read opf
	opfContent, err := os.ReadFile(opfPath)
	if err != nil {
		return "", fmt.Errorf("error reading opf: %w", err)
	}

	// Extract book name and cover path (add logic here)
	// Example using regular expressions (adapt to your opf structure)
	nameRe := regexp.MustCompile(`<dc:title>(.*?)</dc:title>`)
	nameMatch := nameRe.FindStringSubmatch(string(opfContent))
	coverDirectionRe := regexp.MustCompile(`<meta \s*name="cover" \s*content="([^"]+)"`)
	coverDirectionMatch := coverDirectionRe.FindStringSubmatch(string(opfContent))

	coverRe := regexp.MustCompile(`<item href="([^"]+)" \s*id="`+coverDirectionMatch[1]+`"`)
	coverMatch := coverRe.FindStringSubmatch(string(opfContent))

	var bookName, coverPath string
	if len(nameMatch) > 1 {
		bookName = nameMatch[1]
	}
	if len(coverMatch) > 1 {
		coverPath = coverMatch[1]
		// getting the path of the opf file without the file name
		
		fileName := filepath.Base(opfPath)	
		opfPath = strings.TrimSuffix(opfPath, fileName)

		coverPath = "Books/"+opfPath+coverPath
		coverPath = strings.ReplaceAll(coverPath, "\\", "/")

	}

	// Construct the output string
	bookInfo := fmt.Sprintf(`,"%s": {    "name": "%s",    "cover": "%s",    "bookPath": "%s" }`, bookName, bookName, coverPath, "Books/"+epubPath+"/"+fileName)
	return bookInfo, nil
}
