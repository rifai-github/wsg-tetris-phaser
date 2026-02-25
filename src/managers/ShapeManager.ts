import { ShapeData, Tetromino } from '../types';

/**
 * ShapeManager - Mengelola shape data, random generation, dan rotation logic
 *
 * Label tracking system:
 * - usedLabels: SEMUA label yang pernah di-assign ke tetromino di cycle ini (tidak pernah dihapus sampai cycle reset)
 * - lockedLabels: label yang sudah ter-lock di board (untuk no_duplicates tracking)
 * - pendingLabels: label yang di-assign tapi belum di-lock (untuk tracking queue)
 *
 * Rule:
 * - Sekali label di-assign (tampil di tetromino), TIDAK boleh muncul lagi sampai cycle reset
 * - Skip TIDAK mengembalikan label — label tetap "used"
 * - Cycle reset saat semua label sudah used, clear semua kecuali no_duplicates
 */
export class ShapeManager {
  private shapeData: ShapeData[] = [];
  private labelData: string[] = [];
  private currentGameplayType: string = '';
  private suggestedSkills: string[] = [];
  private noDuplicates: string[] = [];

  // Label tracking
  private usedLabels: Set<string> = new Set();      // Semua label yang pernah di-assign (never removed until cycle reset)
  private lockedLabels: Set<string> = new Set();     // Labels yang ter-lock di board
  private pendingLabels: Set<string> = new Set();    // Labels di queue/active belum di-lock
  private nextSearchIndex: number = 0;               // Sequential scanning pointer

  // Track used labels from noDuplicates list
  private usedNoDuplicates: Set<string> = new Set();

  // Track recent shape groups to prevent duplicates within gap
  private recentShapeGroups: string[] = [];
  private readonly SHAPE_GAP: number = 3;

  // Track recent labels to prevent duplicates within gap
  private recentLabels: string[] = [];
  private readonly LABEL_GAP: number = 4;

  constructor() {}

  setGameplayType(type: string): void {
    this.currentGameplayType = type;
  }

  setSuggestedSkills(skills: string[]): void {
    this.suggestedSkills = this.shuffleArray([...skills]);
    console.log('Shuffled suggested skills:', this.suggestedSkills);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  setNoDuplicates(noDuplicates: string[]): void {
    if (this.suggestedSkills.length > 0) {
      this.noDuplicates = noDuplicates.filter(label =>
        this.suggestedSkills.includes(label)
      );
      console.log('Filtered no_duplicates (only items in suggested_skills):', this.noDuplicates);
    } else {
      this.noDuplicates = noDuplicates;
    }
  }

  reset(): void {
    this.recentShapeGroups = [];
    this.recentLabels = [];
    this.usedLabels.clear();
    this.usedNoDuplicates.clear();
    this.lockedLabels.clear();
    this.pendingLabels.clear();
    this.nextSearchIndex = 0;
  }

  /**
   * Resolve split label (S/Z shapes) ke label asli di suggestedSkills.
   * "Growth" atau "Mindset" → "Growth Mindset"
   */
  private resolveOriginalLabel(label: string): string {
    if (this.suggestedSkills.includes(label)) {
      return label;
    }
    for (const skill of this.suggestedSkills) {
      if (!skill.includes(' ')) continue;
      const words = skill.split(' ');
      const midPoint = Math.ceil(words.length / 2);
      const part1 = words.slice(0, midPoint).join(' ');
      const part2 = words.slice(midPoint).join(' ');
      if (label === part1 || label === part2) {
        return skill;
      }
    }
    return label;
  }

  /**
   * Mark labels as locked on board (dipanggil saat tetromino di-lock)
   */
  markLabelsLocked(labels: string[]): void {
    const originalLabels = new Set<string>();
    for (const label of labels) {
      originalLabels.add(this.resolveOriginalLabel(label));
    }

    for (const label of originalLabels) {
      this.pendingLabels.delete(label);
      this.lockedLabels.add(label);
      if (this.noDuplicates.includes(label)) {
        this.usedNoDuplicates.add(label);
        console.log(`Marked "${label}" as used no_duplicate (${this.usedNoDuplicates.size}/${this.noDuplicates.length})`);
      }
    }
    console.log(`Labels locked: [${[...originalLabels].join(', ')}] | Locked: ${this.lockedLabels.size} | Pending: ${this.pendingLabels.size} | Used: ${this.usedLabels.size}`);
  }

  /**
   * Handle skip — label tetap "used", hanya hapus dari pending
   * Label TIDAK dikembalikan ke pool — sekali tampil, tidak boleh muncul lagi
   */
  returnLabelsToPool(labels: string[]): void {
    const originalLabels = new Set<string>();
    for (const label of labels) {
      originalLabels.add(this.resolveOriginalLabel(label));
    }

    for (const label of originalLabels) {
      this.pendingLabels.delete(label);
      // TIDAK hapus dari usedLabels — label tetap "used" walau di-skip
    }
    console.log(`Labels skipped: [${[...originalLabels].join(', ')}] | Pending: ${this.pendingLabels.size} | Used: ${this.usedLabels.size}`);
  }

  private getShapeGroup(shapeName: string): string {
    if (shapeName === 's' || shapeName === 'z') return 'sz';
    if (shapeName === 'l' || shapeName === 'j') return 'lj';
    return shapeName;
  }

  private canUseLabel(label: string): boolean {
    if (!this.noDuplicates.includes(label)) return true;
    if (this.usedNoDuplicates.has(label)) return false;
    return true;
  }

  /**
   * Check if label is fresh — belum pernah di-assign di cycle ini
   */
  private isLabelFresh(label: string): boolean {
    if (this.usedLabels.has(label)) return false;
    if (!this.canUseLabel(label)) return false;
    return true;
  }

  /**
   * Check if there are any valid fresh 2-word labels
   * Jika tidak ada → S/Z shape akan di-reroll ke shape lain
   */
  private hasValidTwoWordLabels(): boolean {
    let availableLabels: string[] = [];
    if (this.suggestedSkills.length > 0) {
      availableLabels = this.suggestedSkills;
    }
    return availableLabels.some(label =>
      label.includes(' ') && this.isLabelFresh(label)
    );
  }

  setShapeData(data: ShapeData[]): void {
    this.shapeData = data;
  }

  setLabelData(labels: string[]): void {
    this.labelData = labels;
  }

  generateRandomTetromino(): Tetromino {
    let randomShape = this.getRandomShape();

    const maxRerollAttempts = 10;
    let rerollAttempts = 0;
    while ((randomShape.shape_name === 's' || randomShape.shape_name === 'z') &&
           !this.hasValidTwoWordLabels() &&
           rerollAttempts < maxRerollAttempts) {
      console.log(`Shape ${randomShape.shape_name.toUpperCase()} selected but no valid 2-word labels, re-rolling...`);
      randomShape = this.getRandomShape();
      rerollAttempts++;
    }

    const labels = this.getLabelsForShape(randomShape);

    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    let matrix = this.cloneMatrix(randomShape.matrix);
    for (let i = 0; i < (finalRotation / 90); i++) {
      matrix = this.rotateMatrix(matrix);
    }

    return {
      shape: randomShape,
      x: Math.floor(4 - matrix[0].length / 2),
      y: 0,
      rotation: finalRotation,
      matrix: matrix,
      labels: labels
    };
  }

  generateRandomTetrominoForSwitch(): Tetromino {
    const randomShape = this.getRandomShapeForSwitch();
    const labels = this.getLabelsForShape(randomShape);

    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    let matrix = this.cloneMatrix(randomShape.matrix);
    for (let i = 0; i < (finalRotation / 90); i++) {
      matrix = this.rotateMatrix(matrix);
    }

    return {
      shape: randomShape,
      x: Math.floor(4 - matrix[0].length / 2),
      y: 0,
      rotation: finalRotation,
      matrix: matrix,
      labels: labels
    };
  }

  private getRandomShape(): ShapeData {
    let availableShapes = this.shapeData;

    if (this.currentGameplayType === 'adapter') {
      availableShapes = this.shapeData.filter(shape =>
        shape.shape_name !== 's' && shape.shape_name !== 'z'
      );
    }

    if (this.recentShapeGroups.length > 0 && availableShapes.length > this.recentShapeGroups.length) {
      availableShapes = availableShapes.filter(shape =>
        !this.recentShapeGroups.includes(this.getShapeGroup(shape.shape_name))
      );
    }

    const randomIndex = Math.floor(Math.random() * availableShapes.length);
    const selectedShape = availableShapes[randomIndex];

    this.recentShapeGroups.push(this.getShapeGroup(selectedShape.shape_name));
    if (this.recentShapeGroups.length > this.SHAPE_GAP) {
      this.recentShapeGroups.shift();
    }

    return selectedShape;
  }

  private getRandomShapeForSwitch(): ShapeData {
    const randomIndex = Math.floor(Math.random() * this.shapeData.length);
    return this.shapeData[randomIndex];
  }

  generateRandomShapeForSwitch(): { shape: ShapeData; rotation: number; matrix: number[][] } {
    const randomShape = this.getRandomShapeForSwitch();

    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    let matrix = this.cloneMatrix(randomShape.matrix);
    for (let i = 0; i < (finalRotation / 90); i++) {
      matrix = this.rotateMatrix(matrix);
    }

    return { shape: randomShape, rotation: finalRotation, matrix };
  }

  private getLabelsForShape(shape: ShapeData): string[] {
    const labels: string[] = [];
    const textPositionCount = shape.text_position.length;

    let availableLabels: string[] = [];
    if (this.suggestedSkills.length > 0) {
      availableLabels = this.suggestedSkills;
    } else {
      availableLabels = shape.label || [];
    }

    if (availableLabels.length === 0) {
      return ['Label'];
    }

    if (textPositionCount === 2) {
      const twoWordLabel = this.getTwoWordLabelFromArray(availableLabels);
      if (twoWordLabel) {
        labels.push(...twoWordLabel);
      } else {
        labels.push(this.getNextLabelFromArray(availableLabels));
        labels.push(this.getNextLabelFromArray(availableLabels));
      }
    } else {
      labels.push(this.getNextLabelFromArray(availableLabels));
    }

    return labels;
  }

  /**
   * Cari fresh multi-word label untuk S/Z shapes.
   * TIDAK reuse dari locked/used — jika tidak ada fresh, return null.
   * S/Z shape akan di-reroll ke shape lain.
   */
  private getTwoWordLabelFromArray(labels: string[]): string[] | null {
    const multiWordLabels = labels.filter(label => label.includes(' '));
    if (multiWordLabels.length === 0) return null;

    let selected: string | null = null;
    const freshMultiWordCount = labels.filter(l => l.includes(' ') && this.isLabelFresh(l)).length;

    for (let i = 0; i < labels.length; i++) {
      const idx = (this.nextSearchIndex + i) % labels.length;
      const label = labels[idx];

      if (!label.includes(' ')) continue;
      if (!this.isLabelFresh(label)) continue;
      if (this.recentLabels.includes(label) && freshMultiWordCount > 1) continue;

      selected = label;
      this.nextSearchIndex = (idx + 1) % labels.length;
      break;
    }

    if (!selected) return null;

    // Mark as used dan pending
    this.usedLabels.add(selected);
    this.pendingLabels.add(selected);

    this.recentLabels.push(selected);
    if (this.recentLabels.length > this.LABEL_GAP) {
      this.recentLabels.shift();
    }

    console.log(`Two-word label assigned: "${selected}" | Used: ${this.usedLabels.size}/${labels.length}`);

    const words = selected.split(' ');
    const midPoint = Math.ceil(words.length / 2);
    return [words.slice(0, midPoint).join(' '), words.slice(midPoint).join(' ')];
  }

  /**
   * Get next label secara sequential.
   * Pass 1: cari fresh label (belum pernah di-assign di cycle ini)
   * Pass 2: cycle reset — semua label sudah used, clear dan mulai ulang (kecuali no_duplicates)
   */
  private getNextLabelFromArray(labels: string[]): string {
    if (labels.length === 0) return 'Label';

    // Pass 1: cari fresh label
    const freshCount = labels.filter(label => this.isLabelFresh(label)).length;

    for (let i = 0; i < labels.length; i++) {
      const idx = (this.nextSearchIndex + i) % labels.length;
      const label = labels[idx];

      if (!this.isLabelFresh(label)) continue;
      if (this.recentLabels.includes(label) && freshCount > this.LABEL_GAP) continue;

      // Found fresh label — mark as used dan pending
      this.usedLabels.add(label);
      this.pendingLabels.add(label);
      this.nextSearchIndex = (idx + 1) % labels.length;

      this.recentLabels.push(label);
      if (this.recentLabels.length > this.LABEL_GAP) {
        this.recentLabels.shift();
      }

      console.log(`Label assigned (fresh): "${label}" | Used: ${this.usedLabels.size}/${labels.length}`);
      return label;
    }

    // Pass 2: semua label sudah used — cycle reset
    console.log(`All ${labels.length} labels used, resetting cycle (locked: ${this.lockedLabels.size}, pending: ${this.pendingLabels.size})`);

    // Clear usedLabels, tapi re-add yang masih pending (di queue) agar tidak duplikat di queue
    this.usedLabels.clear();
    for (const pending of this.pendingLabels) {
      this.usedLabels.add(pending);
    }

    // Clear lockedLabels (sudah cycle baru)
    this.lockedLabels.clear();

    // Reset no_duplicates jika semua sudah terpakai
    if (this.noDuplicates.length > 0 && this.usedNoDuplicates.size >= this.noDuplicates.length) {
      console.log('All no_duplicates used, resetting no_duplicates cycle');
      this.usedNoDuplicates.clear();
    }

    // Cari label fresh setelah reset
    for (let i = 0; i < labels.length; i++) {
      const idx = (this.nextSearchIndex + i) % labels.length;
      const label = labels[idx];

      if (!this.isLabelFresh(label)) continue;

      this.usedLabels.add(label);
      this.pendingLabels.add(label);
      this.nextSearchIndex = (idx + 1) % labels.length;

      this.recentLabels.push(label);
      if (this.recentLabels.length > this.LABEL_GAP) this.recentLabels.shift();

      console.log(`Label assigned (after reset): "${label}" | Used: ${this.usedLabels.size}/${labels.length}`);
      return label;
    }

    return labels[0];
  }

  private countTiles(matrix: number[][]): number {
    let count = 0;
    for (let row of matrix) {
      for (let cell of row) {
        if (cell === 1) count++;
      }
    }
    return count;
  }

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

  rotateTetromino(tetromino: Tetromino): Tetromino {
    const newRotation = (tetromino.rotation + 90) % 360;
    const newMatrix = this.rotateMatrix(tetromino.matrix);

    return {
      ...tetromino,
      rotation: newRotation,
      matrix: newMatrix
    };
  }

  private cloneMatrix(matrix: number[][]): number[][] {
    return matrix.map(row => [...row]);
  }

  getShapeByName(name: string): ShapeData | undefined {
    return this.shapeData.find(shape => shape.shape_name === name);
  }
}
