import { ShapeData, Tetromino } from '../types';

/**
 * ShapeManager - Mengelola shape data, random generation, dan rotation logic
 */
export class ShapeManager {
  private shapeData: ShapeData[] = [];
  private labelData: string[] = [];
  private usedLabels: Set<string> = new Set();
  private currentGameplayType: string = '';

  constructor() {}

  /**
   * Set current gameplay type (untuk filter shape tertentu)
   */
  setGameplayType(type: string): void {
    this.currentGameplayType = type;
  }

  /**
   * Load shape data dari JSON
   */
  setShapeData(data: ShapeData[]): void {
    this.shapeData = data;
  }

  /**
   * Load label data dari JSON
   */
  setLabelData(labels: string[]): void {
    this.labelData = labels;
  }

  /**
   * Generate random tetromino with random rotation
   * Untuk next tetromino (terfilter berdasarkan gameplay mode)
   */
  generateRandomTetromino(): Tetromino {
    const randomShape = this.getRandomShape();
    const labels = this.getLabelsForShape(randomShape);

    // Generate random rotation (0, 90, 180, 270)
    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

    // Skip rotation for O shape since it doesn't need it
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    // Apply rotation to matrix if needed
    let matrix = this.cloneMatrix(randomShape.matrix);
    let currentRotation = finalRotation;

    // Rotate matrix to match the rotation angle
    for (let i = 0; i < (finalRotation / 90); i++) {
      matrix = this.rotateMatrix(matrix);
    }

    return {
      shape: randomShape,
      x: Math.floor(4 - matrix[0].length / 2), // Center horizontal based on rotated matrix
      y: 0,
      rotation: finalRotation,
      matrix: matrix,
      labels: labels
    };
  }

  /**
   * Generate random tetromino tanpa filter (untuk switch)
   * Bisa menghasilkan SEMUA shape termasuk S dan Z
   */
  generateRandomTetrominoForSwitch(): Tetromino {
    const randomShape = this.getRandomShapeForSwitch();
    const labels = this.getLabelsForShape(randomShape);

    // Generate random rotation (0, 90, 180, 270)
    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

    // Skip rotation for O shape since it doesn't need it
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    // Apply rotation to matrix if needed
    let matrix = this.cloneMatrix(randomShape.matrix);
    let currentRotation = finalRotation;

    // Rotate matrix to match the rotation angle
    for (let i = 0; i < (finalRotation / 90); i++) {
      matrix = this.rotateMatrix(matrix);
    }

    return {
      shape: randomShape,
      x: Math.floor(4 - matrix[0].length / 2), // Center horizontal based on rotated matrix
      y: 0,
      rotation: finalRotation,
      matrix: matrix,
      labels: labels
    };
  }

  /**
   * Get random shape dari shape data
   * Di adapter mode, filter shape S dan Z
   */
  private getRandomShape(): ShapeData {
    // Filter shape berdasarkan gameplay type
    let availableShapes = this.shapeData;

    if (this.currentGameplayType === 'adapter') {
      // Di adapter mode, exclude shape S dan Z
      availableShapes = this.shapeData.filter(shape =>
        shape.shape_name !== 's' && shape.shape_name !== 'z'
      );
    }

    const randomIndex = Math.floor(Math.random() * availableShapes.length);
    return availableShapes[randomIndex];
  }

  /**
   * Get random shape tanpa filter (untuk switch)
   * Mengembalikan SEMUA shape termasuk S dan Z
   */
  private getRandomShapeForSwitch(): ShapeData {
    const randomIndex = Math.floor(Math.random() * this.shapeData.length);
    return this.shapeData[randomIndex];
  }

  /**
   * Get labels untuk shape berdasarkan jumlah text_position
   */
  private getLabelsForShape(shape: ShapeData): string[] {
    const labels: string[] = [];
    const textPositionCount = shape.text_position.length;
    const availableLabels = shape.label || []; // Get labels from shape

    if (availableLabels.length === 0) {
      return ['Label']; // Fallback if no labels available
    }

    // Jika ada 2 text position (S dan Z), coba ambil 2-word label
    if (textPositionCount === 2) {
      const twoWordLabel = this.getTwoWordLabelFromArray(availableLabels);
      if (twoWordLabel) {
        labels.push(...twoWordLabel);
      } else {
        // Fallback: ambil 2 label berbeda dari shape.label
        labels.push(this.getRandomLabelFromArray(availableLabels));
        labels.push(this.getRandomLabelFromArray(availableLabels));
      }
    } else {
      // Shape lain: 1 label dari shape.label
      labels.push(this.getRandomLabelFromArray(availableLabels));
    }

    return labels;
  }

  /**
   * Cari label yang terdiri dari 2 kata dari array (seperti "Data Analytics")
   */
  private getTwoWordLabelFromArray(labels: string[]): string[] | null {
    const twoWordLabels = labels.filter(label => label.includes(' '));
    if (twoWordLabels.length > 0) {
      const selected = twoWordLabels[Math.floor(Math.random() * twoWordLabels.length)];
      const words = selected.split(' ');
      return words;
    }
    return null;
  }

  /**
   * Get random label dari array yang diberikan
   */
  private getRandomLabelFromArray(labels: string[]): string {
    if (labels.length === 0) {
      return 'Label';
    }
    
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    
    return randomLabel;
  }

  /**
   * Hitung jumlah tile dalam matrix
   */
  private countTiles(matrix: number[][]): number {
    let count = 0;
    for (let row of matrix) {
      for (let cell of row) {
        if (cell === 1) count++;
      }
    }
    return count;
  }

  /**
   * Rotate matrix 90 derajat clockwise
   */
  rotateMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = [];

    for (let col = 0; col < cols; col++) {
      const newRow: number[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        newRow.push(matrix[row][col]);
      }
      rotated.push(newRow);
    }

    return rotated;
  }

  /**
   * Rotate tetromino (update rotation angle dan matrix)
   */
  rotateTetromino(tetromino: Tetromino): Tetromino {
    const newRotation = (tetromino.rotation + 90) % 360;
    const newMatrix = this.rotateMatrix(tetromino.matrix);

    return {
      ...tetromino,
      rotation: newRotation,
      matrix: newMatrix
    };
  }

  /**
   * Clone matrix
   */
  private cloneMatrix(matrix: number[][]): number[][] {
    return matrix.map(row => [...row]);
  }

  /**
   * Get shape data by name
   */
  getShapeByName(name: string): ShapeData | undefined {
    return this.shapeData.find(shape => shape.shape_name === name);
  }
}
