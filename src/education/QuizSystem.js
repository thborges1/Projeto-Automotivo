export class QuizSystem {
  constructor(activity) { this.activity = activity; this.index = 0; this.answers = []; }
  get question() { return this.activity.questions[this.index]; }
  answer(choice) {
    if (!Number.isInteger(choice) || choice < 0 || choice >= this.question.options.length) throw new Error('Alternativa inválida');
    if (this.answers[this.index] !== undefined) return this.answers[this.index];
    const result = { choice, correct: choice === this.question.answer };
    this.answers[this.index] = result; return result;
  }
  next() {
    if (!this.answers[this.index]) return false;
    if (this.index < this.activity.questions.length - 1) { this.index++; return true; }
    return false;
  }
  get finished() { return this.answers.length === this.activity.questions.length && this.answers.every(Boolean); }
  get score() { return this.answers.filter(a => a.correct).length; }
}
