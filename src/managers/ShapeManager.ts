import { ShapeData, Tetromino } from '../types';

/**
 * ShapeManager - Mengelola shape data, random generation, dan rotation logic
 */
export class ShapeManager {
  private shapeData: ShapeData[] = [];
  private labelData: string[] = [];
  private usedLabels: Set<string> = new Set();
  private currentGameplayType: string = '';
  private suggestedSkills: string[] = [];

  // Track recent shape groups to prevent duplicates within gap
  // Shape groups: S/Z are treated as same, L/J are treated as same
  // If L is spawned, neither L nor J will appear for at least SHAPE_GAP tetrominos
  private recentShapeGroups: string[] = [];
  private readonly SHAPE_GAP: number = 3; // Minimum gap before same shape group can appear again

  // Track recent labels to prevent duplicates within gap
  // If label "Agile" is used, it won't appear again for at least LABEL_GAP tetrominos
  private recentLabels: string[] = [];
  private readonly LABEL_GAP: number = 4; // Minimum gap before same label can appear again

  constructor() {}

  /**
   * Set current gameplay type (untuk filter shape tertentu)
   */
  setGameplayType(type: string): void {
    this.currentGameplayType = type;
  }

  /**
   * Set suggested skills from URL parameter
   */
  setSuggestedSkills(skills: string[]): void {
    this.suggestedSkills = skills;
  }

  /**
   * Reset state untuk game baru
   */
  reset(): void {
    this.recentShapeGroups = [];
    this.recentLabels = [];
    this.usedLabels.clear();
  }

  /**
   * Get shape group for duplicate prevention
   * S/Z are treated as same group, L/J are treated as same group
   */
  private getShapeGroup(shapeName: string): string {
    if (shapeName === 's' || shapeName === 'z') {
      return 'sz'; // S and Z are similar shapes
    }
    if (shapeName === 'l' || shapeName === 'j') {
      return 'lj'; // L and J are similar shapes
    }
    return shapeName; // I, O, T are unique
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
   * Mencegah bentuk yang sama (atau grup yang sama) muncul dalam SHAPE_GAP tetromino terakhir
   * Shape groups: S/Z sama, L/J sama
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

    // Exclude recent shape groups to ensure minimum gap before same shape group appears again
    // S/Z treated as same group, L/J treated as same group
    if (this.recentShapeGroups.length > 0 && availableShapes.length > this.recentShapeGroups.length) {
      availableShapes = availableShapes.filter(shape =>
        !this.recentShapeGroups.includes(this.getShapeGroup(shape.shape_name))
      );
    }

    const randomIndex = Math.floor(Math.random() * availableShapes.length);
    const selectedShape = availableShapes[randomIndex];

    // Add shape group to recent and maintain max size of SHAPE_GAP
    this.recentShapeGroups.push(this.getShapeGroup(selectedShape.shape_name));
    if (this.recentShapeGroups.length > this.SHAPE_GAP) {
      this.recentShapeGroups.shift(); // Remove oldest shape group
    }

    return selectedShape;
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
   * Prioritas: suggested_skills dari URL parameter > shape.label dari JSON
   */
  private getLabelsForShape(shape: ShapeData): string[] {
    const labels: string[] = [];
    const textPositionCount = shape.text_position.length;

    // Gunakan suggested_skills jika tersedia, fallback ke shape.label
    let availableLabels: string[] = [];
    if (this.suggestedSkills.length > 0) {
      availableLabels = this.suggestedSkills;
    } else {
      availableLabels = shape.label || []; // Fallback ke shape.label dari JSON
    }

    if (availableLabels.length === 0) {
      return ['Label']; // Fallback jika tidak ada labels available
    }

    // Jika ada 2 text position (S dan Z), coba ambil 2-word label
    if (textPositionCount === 2) {
      const twoWordLabel = this.getTwoWordLabelFromArray(availableLabels);
      if (twoWordLabel) {
        labels.push(...twoWordLabel);
      } else {
        // Fallback: ambil 2 label berbeda
        labels.push(this.getNextLabelFromArray(availableLabels));
        labels.push(this.getNextLabelFromArray(availableLabels));
      }
    } else {
      // Shape lain: 1 label
      labels.push(this.getNextLabelFromArray(availableLabels));
    }

    return labels;
  }

  /**
   * Cari label yang terdiri dari multi-kata dan bagi menjadi 2 bagian seimbang
   * Untuk shape S dan Z yang punya 2 text position
   * Juga track label di recentLabels untuk mencegah duplikat
   *
   * Contoh:
   * - 2 kata "data analytics" → ["data", "analytics"]
   * - 3 kata "join the dots" → ["join", "the dots"]
   * - 4 kata "join the dots oke" → ["join the", "dots oke"]
   * - 5 kata "join the dots today please" → ["join the dots", "today please"]
   */
  private getTwoWordLabelFromArray(labels: string[]): string[] | null {
    // Filter multi-word labels
    let multiWordLabels = labels.filter(label => label.includes(' '));

    if (multiWordLabels.length === 0) {
      return null;
    }

    // Filter out recent labels to ensure minimum gap
    if (this.recentLabels.length > 0 && multiWordLabels.length > 1) {
      const filtered = multiWordLabels.filter(label => !this.recentLabels.includes(label));
      if (filtered.length > 0) {
        multiWordLabels = filtered;
      }
    }

    // Select random multi-word label
    const selected = multiWordLabels[Math.floor(Math.random() * multiWordLabels.length)];
    const words = selected.split(' ');

    // Add to recent labels and maintain max size of LABEL_GAP
    this.recentLabels.push(selected);
    if (this.recentLabels.length > this.LABEL_GAP) {
      this.recentLabels.shift(); // Remove oldest label
    }

    // Hitung titik tengah untuk pembagian seimbang
    const midPoint = Math.ceil(words.length / 2);

    // Bagi menjadi 2 label
    const label1 = words.slice(0, midPoint).join(' ');
    const label2 = words.slice(midPoint).join(' ');

    return [label1, label2];
  }

  /**
   * Get next label yang tidak ada di recentLabels
   * Mencegah label yang sama muncul dalam LABEL_GAP tetromino terakhir
   */
  private getNextLabelFromArray(labels: string[]): string {
    if (labels.length === 0) {
      return 'Label';
    }

    // Filter out recent labels to ensure minimum gap
    let availableLabels = labels;
    if (this.recentLabels.length > 0 && labels.length > this.recentLabels.length) {
      availableLabels = labels.filter(label => !this.recentLabels.includes(label));
    }

    // If all labels are recent, use all labels (fallback)
    if (availableLabels.length === 0) {
      availableLabels = labels;
    }

    // Select random label from available
    const randomIndex = Math.floor(Math.random() * availableLabels.length);
    const selectedLabel = availableLabels[randomIndex];

    // Add to recent labels and maintain max size of LABEL_GAP
    this.recentLabels.push(selectedLabel);
    if (this.recentLabels.length > this.LABEL_GAP) {
      this.recentLabels.shift(); // Remove oldest label
    }

    return selectedLabel;
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
