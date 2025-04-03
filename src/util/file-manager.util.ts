import * as fs from 'fs';
import * as path from 'path';

// Ensure the output directory exists
function ensureDirectoryExists(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {recursive: true});
    console.log(`Created directory: ${directory}`);
  }
}

export class FileManager {
  /**
   * Recursivelylears all contents of a directory
   * @param directory - The directory to clear
   */
  static clearDirectory(directory: string): void {
    if (fs.existsSync(directory)) {
      fs.rmSync(directory, {recursive: true, force: true});
      console.log(`Cleared directory: ${directory}`);
    }
  }

  /**
   * Initializes a file, creating the directory if it doesn't exist and clearing the file contents if it does.
   * @param directory - The directory to create the file in
   * @param fileName - The name of the file to initialize
   * @returns The path to the initialized file
   */
  static initializeFile(directory: string, fileName: string): string {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {recursive: true});
    }

    const filePath = path.join(directory, fileName);
    fs.writeFileSync(filePath, '');

    return filePath;
  }

  /**
   * Write data to a JSON file. Will overwrite contents of the file if it exists.
   * @param filePath - The path to the file to write the data to
   * @param data - The data to write to the file
   */
  static writeToFile(filePath: string, data: any): void {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Data written to: ${filePath}`);
  }

  /**
   * Appends content to a file. Will create the file if it doesn't exist.
   * @param filePath - The path to the file to append the content to
   * @param content - The content to append to the file
   */
  static appendToFile(filePath: string, content: string): void {
    ensureDirectoryExists(path.dirname(filePath));
    fs.appendFileSync(filePath, content);
    console.log(`Content appended to: ${filePath}`);
  }

  /**
   * Reads a JSON file and parses it into an object.
   * @param filePath - The path to the file to read
   * @returns The parsed object
   */
  static readJsonFile(filePath: string): any {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
}
