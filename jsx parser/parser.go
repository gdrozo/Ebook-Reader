package main

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/fsnotify/fsnotify"
)

// calculateHash calculates the SHA256 hash of a file.
func calculateHash(filePath string) (string, error) {
 file, err := os.Open(filePath)
 if err != nil {
  return "", err
 }
 defer file.Close()

 hash := sha256.New()
 if _, err := io.Copy(hash, file); err != nil {
  return "", err
 }

 return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

// extractJSX extracts JSX code blocks from a file.
func extractJSX(filePath string) (string, error) {
	content, err := ioutil.ReadFile(filePath)
	
	if err != nil {
		return "", err
	}

	// This regex looks for JSX-like code between < and >.  Adjust as needed.
	re := regexp.MustCompile(`return[ \n]+\(([^)]+\))`)

	matches := re.Find(content)

	// Check if the match is empty
	if matches == nil {
		re = regexp.MustCompile(`return[ ]+(<[^\n]+)`)
		matches = re.Find(content)
	}

	// If the match is still empty, return an error
	if matches == nil {
		return "", errors.New("no JSX code found in the file")
	}

	group1 := re.FindStringSubmatch(string(matches))[1]


	jsxCode := "return `"+group1+"`"

	// Replacing the new jsx code with the original code
	content = bytes.Replace(content, matches, []byte(jsxCode), 1)

	// From html elements that start in a capital letter to functions. All of them
	// One liners only -> <Tt/> -> ` + Tt() +`
	re = regexp.MustCompile(`<([A-Z][^/>]+)/>`)
	singleElements := re.FindAll(content, -1)

	for _, singleElement := range singleElements {

		fmt.Println(singleElement)
	}
	result := string(content)

	return result, nil
}

func main() {
	dir := flag.String("dir", ".", "Directory to watch")
 	flag.Parse()

	fmt.Printf("Watching directory: %s\n", *dir)

	// Create a new watcher.
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
	log.Fatal(err)
	}
	defer watcher.Close()

	// Add directory to watcher.
	err = watcher.Add(*dir)
	if err != nil {
	log.Fatal(err)
	}

	// Keep track of file hashes.
	fileHashes := make(map[string]string)

	// Initial scan of the directory.
	filepath.Walk(*dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		jsxCode, hash, err := processFile(path, info)

		if err != nil {
			log.Printf("Error processing file %s: %v", path, err)
			return err
		}

		if hash == "" {
			return nil
		}
		
		fileHashes[path] = hash

		saveParsedFile(path, jsxCode)

		return nil
	})

 	// Start listening for events.
	done := make(chan bool)
	go func() {
		for {
			select {
				case event, ok := <-watcher.Events:
					if !ok {
						return
					}	
					log.Println("event:", event)

					// Process only .jsx files
					if filepath.Ext(event.Name) != ".jsx" {
						continue
					}

					if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Create == fsnotify.Create {
						newHash, err := calculateHash(event.Name)
						if err != nil {
							log.Printf("Error calculating hash for %s: %v", event.Name, err)
							continue
						}

						if fileHashes[event.Name] != newHash {
							fmt.Println("File modified:", event.Name)
							fileHashes[event.Name] = newHash // Update the hash

							jsxCode, err := extractJSX(event.Name)
			
							if err != nil {
								log.Printf("Error extracting JSX from %s: %v", event.Name, err)
								continue
							}

							saveParsedFile(event.Name, jsxCode)
							
							fmt.Printf("New JSX from %s:\n%s", event.Name, jsxCode)
						} else {
							fmt.Println("File modified, but content unchanged:", event.Name)
						}
					} else if event.Op&fsnotify.Remove == fsnotify.Remove || event.Op&fsnotify.Rename == fsnotify.Rename {
						delete(fileHashes, event.Name)
						fmt.Println("File removed or renamed:", event.Name)
					}
				case err, ok := <-watcher.Errors:
					if !ok {
						return
					}
					
					log.Println("error:", err)
			}
		}
	}()

 <-done // Block main function until program is interrupted.
}


func saveParsedFile(filePath string, jsxCode string) {
	
	pathWithoutExt := strings.TrimSuffix(filePath, filepath.Ext(filePath))
	
	file, err := os.Create(pathWithoutExt + ".js")
	
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	_, err = file.WriteString(jsxCode)
	if err != nil {
		log.Fatal(err)
	}
}

func processFile(path string, info os.FileInfo) (string, string,error) { 
	if !info.IsDir() && filepath.Ext(path) == ".jsx" { // Process only .jsx files
		hash, err := calculateHash(path)
		
		if err != nil {
			log.Printf("Error calculating hash for %s: %v", path, err)
			return "", "", nil
		}

		jsxCode, err := extractJSX(path)
		
		if err != nil {
			log.Printf("Error extracting JSX from %s: %v", path, err)
			return "",   "",nil
		}
		
		fmt.Printf("Initial JSX from %s:\n%s", path, jsxCode)
		return jsxCode, hash, nil
	}

	return "", "", nil
}