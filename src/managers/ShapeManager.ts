import { ShapeData, Tetromino } from '../types';

/**
 * ShapeManager - Mengelola shape data, random generation, dan rotation logic
 *
 * Label tracking menggunakan lock-based system:
 * - pendingLabels: label yang sudah di-assign ke tetromino di queue tapi belum di-lock
 * - lockedLabels: label yang sudah ter-lock di board (tidak boleh muncul lagi sampai cycle reset)
 * - Saat skip: label dikembalikan ke pool (hapus dari pendingLabels)
 * - Saat lock: label dipindah dari pending ke locked
 * - Cycle reset: saat semua label sudah locked, reset lockedLabels (kecuali no_duplicates)
 */
export class ShapeManager {
  private shapeData: ShapeData[] = [];
  private labelData: string[] = [];
  private currentGameplayType: string = '';
  private suggestedSkills: string[] = [];
  private noDuplicates: string[] = [];

  // Lock-based label tracking
  private lockedLabels: Set<string> = new Set();   // Labels yang sudah ter-lock di board
  private pendingLabels: Set<string> = new Set();   // Labels yang di-assign tapi belum di-lock
  private nextSearchIndex: number = 0;              // Sequential scanning pointer

  // Track used labels from noDuplicates list
  private usedNoDuplicates: Set<string> = new Set();

  // Track recent shape groups to prevent duplicates within gap
  // Shape groups: S/Z are treated as same, L/J are treated as same
  // If L is spawned, neither L nor J will appear for at least SHAPE_GAP tetrominos
  private recentShapeGroups: string[] = [];
  private readonly SHAPE_GAP: number = 3; // Minimum gap before same shape group can appear again

  // Track recent labels to prevent duplicates within gap
  // If label "Agile" is used, it won't appear again for at least LABEL_GAP tetromino
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
   * Shuffles the array first for variety, then uses sequentially
   */
  setSuggestedSkills(skills: string[]): void {
    // Shuffle the array for variety between game sessions
    this.suggestedSkills = this.shuffleArray([...skills]);
    console.log('Shuffled suggested skills:', this.suggestedSkills);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Set no duplicates list from URL parameter
   * Filters to only include labels that are actually in suggested_skills
   */
  setNoDuplicates(noDuplicates: string[]): void {
    // Only keep no_duplicates items that exist in suggested_skills
    if (this.suggestedSkills.length > 0) {
      this.noDuplicates = noDuplicates.filter(label =>
        this.suggestedSkills.includes(label)
      );
      console.log('Filtered no_duplicates (only items in suggested_skills):', this.noDuplicates);
    } else {
      this.noDuplicates = noDuplicates;
    }
  }

  /**
   * Reset state untuk game baru
   */
  reset(): void {
    this.recentShapeGroups = [];
    this.recentLabels = [];
    this.usedNoDuplicates.clear();
    this.lockedLabels.clear();
    this.pendingLabels.clear();
    this.nextSearchIndex = 0;
  }

  /**
   * Mark labels as locked on board (dipanggil saat tetromino di-lock)
   * Pindah dari pending ke locked, dan track no_duplicates
   */
  markLabelsLocked(labels: string[]): void {
    for (const label of labels) {
      this.pendingLabels.delete(label);
      this.lockedLabels.add(label);
      if (this.noDuplicates.includes(label)) {
        this.usedNoDuplicates.add(label);
        console.log(`Marked "${label}" as used no_duplicate (${this.usedNoDuplicates.size}/${this.noDuplicates.length})`);
      }
    }
    console.log(`Labels locked: [${labels.join(', ')}] | Total locked: ${this.lockedLabels.size} | Pending: ${this.pendingLabels.size}`);
  }

  /**
   * Return labels to pool (dipanggil saat tetromino di-skip)
   * Hapus dari pending sehingga bisa di-assign lagi ke tetromino baru
   */
  returnLabelsToPool(labels: string[]): void {
    for (const label of labels) {
      this.pendingLabels.delete(label);
    }
    console.log(`Labels returned to pool: [${labels.join(', ')}] | Pending: ${this.pendingLabels.size}`);
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
   * Check if label can be used based on no_duplicates rules
   * Returns true if label can be used, false if it should be skipped
   */
  private canUseLabel(label: string): boolean {
    // If label not in noDuplicates list, it can always be used
    if (!this.noDuplicates.includes(label)) {
      return true;
    }

    // If label is in noDuplicates and already used, skip it
    if (this.usedNoDuplicates.has(label)) {
      return false;
    }

    // Label is in noDuplicates but not used yet, can be used
    return true;
  }

  /**
   * Check if a label is available for assignment
   * Must not be locked, pending, or blocked by no_duplicates
   */
  private isLabelAvailable(label: string): boolean {
    if (this.lockedLabels.has(label)) return false;
    if (this.pendingLabels.has(label)) return false;
    if (!this.canUseLabel(label)) return false;
    return true;
  }

  /**
   * Try to reset the cycle if all available labels are exhausted
   * Reset lockedLabels saat semua label sudah locked, kecuali no_duplicates
   */
  private tryResetCycleIfNeeded(labels: string[]): boolean {
    // Hitung berapa label yang masih available
    const availableCount = labels.filter(label => this.isLabelAvailable(label)).length;

    if (availableCount === 0 && this.lockedLabels.size > 0) {
      console.log(`All labels exhausted (locked: ${this.lockedLabels.size}, pending: ${this.pendingLabels.size}), resetting cycle`);

      // Clear locked labels sehingga bisa dipakai lagi
      this.lockedLabels.clear();

      // Reset no_duplicates jika semua sudah terpakai
      if (this.noDuplicates.length > 0 && this.usedNoDuplicates.size >= this.noDuplicates.length) {
        console.log('All no_duplicates used, resetting no_duplicates cycle');
        this.usedNoDuplicates.clear();
      }

      return true; // Cycle was reset
    }

    return false; // No reset needed
  }

  /**
   * Check if there are any valid 2-word labels available
   * Used to determine if S/Z shapes can be spawned
   */
  private hasValidTwoWordLabels(): boolean {
    // Get available labels (suggested_skills or fallback)
    let availableLabels: string[] = [];
    if (this.suggestedSkills.length > 0) {
      availableLabels = this.suggestedSkills;
    }

    // Check if any available multi-word label exists
    // If cycle would reset, check if any multi-word label exists at all
    const hasAvailableMultiWord = availableLabels.some(label =>
      label.includes(' ') && this.isLabelAvailable(label)
    );

    if (hasAvailableMultiWord) return true;

    // If no available multi-word labels, check if a cycle reset would make one available
    if (this.lockedLabels.size > 0) {
      return availableLabels.some(label => label.includes(' '));
    }

    return false;
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
    let randomShape = this.getRandomShape();

    // If shape is S or Z and no valid 2-word labels available, re-roll to get different shape
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

    // Generate random rotation (0, 90, 180, 270)
    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

    // Skip rotation for O shape since it doesn't need it
    const finalRotation = randomShape.shape_name === 'o' ? 0 : randomRotation;

    // Apply rotation to matrix if needed
    let matrix = this.cloneMatrix(randomShape.matrix);

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
   * Generate random shape with rotation for switch (tanpa consume label)
   * Hanya return shape, rotation, dan matrix — label tidak di-generate
   * Ini mencegah label queue ter-consume sia-sia saat switch mencoba banyak shape
   */
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
   * Menggunakan sequential selection dari multi-word labels
   *
   * Contoh:
   * - 2 kata "data analytics" → ["data", "analytics"]
   * - 3 kata "join the dots" → ["join", "the dots"]
   * - 4 kata "join the dots oke" → ["join the", "dots oke"]
   * - 5 kata "join the dots today please" → ["join the dots", "today please"]
   */
  private getTwoWordLabelFromArray(labels: string[]): string[] | null {
    // Filter multi-word labels
    const multiWordLabels = labels.filter(label => label.includes(' '));

    if (multiWordLabels.length === 0) {
      return null;
    }

    // Try cycle reset if needed
    this.tryResetCycleIfNeeded(labels);

    // Count available multi-word labels (for recentLabels check)
    let availableMultiWordCount = 0;
    for (const label of labels) {
      if (label.includes(' ') && this.isLabelAvailable(label)) {
        availableMultiWordCount++;
      }
    }

    // Search forward from nextSearchIndex for the next valid multi-word label.
    // - Single-word labels: SKIPPED (stay available for getNextLabelFromArray)
    // - Blocked labels: SKIPPED
    let selected: string | null = null;

    for (let i = 0; i < labels.length; i++) {
      const idx = (this.nextSearchIndex + i) % labels.length;
      const label = labels[idx];

      if (!label.includes(' ')) continue; // skip single-word

      if (!this.isLabelAvailable(label)) continue; // skip locked/pending/blocked

      if (this.recentLabels.includes(label) && availableMultiWordCount > 1) continue;

      selected = label;
      this.nextSearchIndex = (idx + 1) % labels.length;
      break;
    }

    // No valid multi-word label found
    if (!selected) return null;

    // Mark as pending (akan di-lock saat tetromino di-lock ke board)
    this.pendingLabels.add(selected);

    this.recentLabels.push(selected);
    if (this.recentLabels.length > this.LABEL_GAP) {
      this.recentLabels.shift();
    }

    console.log(`Two-word label assigned: "${selected}" | Pending: ${this.pendingLabels.size} | Locked: ${this.lockedLabels.size}`);

    // Hitung titik tengah untuk pembagian seimbang
    const words = selected.split(' ');
    const midPoint = Math.ceil(words.length / 2);

    return [words.slice(0, midPoint).join(' '), words.slice(midPoint).join(' ')];
  }

  /**
   * Get next label secara sequential/urutan
   * Cycle through labels in order, respecting lock-based tracking dan no_duplicates rules
   */
  private getNextLabelFromArray(labels: string[]): string {
    if (labels.length === 0) {
      return 'Label';
    }

    // Try cycle reset if needed
    this.tryResetCycleIfNeeded(labels);

    // Count available labels (for recentLabels check)
    const availableCount = labels.filter(label => this.isLabelAvailable(label)).length;

    // Search forward from nextSearchIndex for the next available label
    for (let i = 0; i < labels.length; i++) {
      const idx = (this.nextSearchIndex + i) % labels.length;
      const label = labels[idx];

      if (!this.isLabelAvailable(label)) continue;

      if (this.recentLabels.includes(label) && availableCount > this.LABEL_GAP) continue;

      // Found a valid label — mark as pending
      this.pendingLabels.add(label);
      this.nextSearchIndex = (idx + 1) % labels.length;

      this.recentLabels.push(label);
      if (this.recentLabels.length > this.LABEL_GAP) {
        this.recentLabels.shift();
      }

      console.log(`Label assigned: "${label}" | Pending: ${this.pendingLabels.size} | Locked: ${this.lockedLabels.size}`);
      return label;
    }

    // All labels exhausted — force cycle reset and retry once
    if (this.lockedLabels.size > 0) {
      console.log('Force cycle reset — all labels locked/pending/blocked');
      this.lockedLabels.clear();

      if (this.noDuplicates.length > 0 && this.usedNoDuplicates.size >= this.noDuplicates.length) {
        this.usedNoDuplicates.clear();
      }

      for (let i = 0; i < labels.length; i++) {
        const idx = (this.nextSearchIndex + i) % labels.length;
        const label = labels[idx];
        if (!this.isLabelAvailable(label)) continue;

        this.pendingLabels.add(label);
        this.nextSearchIndex = (idx + 1) % labels.length;
        this.recentLabels.push(label);
        if (this.recentLabels.length > this.LABEL_GAP) this.recentLabels.shift();
        return label;
      }
    }

    return labels[0];
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
