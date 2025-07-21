import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export async function analyzeImage(imagePath: string) {
  const scriptPath = path.resolve('analyze.py');

  try {
    const { stdout } = await execFileAsync('python3', [scriptPath, imagePath]);
    const result = JSON.parse(stdout);
    return result; 
  } catch (error) {
    console.error('Erreur analyse image:', error);
    throw new Error("L'analyse de l'image a échoué");
  }
}