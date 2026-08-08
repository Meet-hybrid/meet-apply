/**
 * business.js — Summer business instructor applications (original: app/models/business.rb).
 */
const { BaseModel } = require('./base');

class Business extends BaseModel {
  constructor() {
    super('businesses', [
      { name: 'first_name', type: 'string', label: 'First name', required: true },
      { name: 'last_name', type: 'string', label: 'Last name', required: true },
      { name: 'email', type: 'string', label: 'Email address', required: true, email: true },
      { name: 'major', type: 'string', label: 'Major(s), program, or research area', required: true },
      { name: 'graduation_year', type: 'date', label: 'Graduation year', yearOnly: true, required: true },
      { name: 'why_meet', type: 'text', label: 'Please describe in about 300 words why you want to participate in MEET.', required: true },
      { name: 'experience', type: 'text', label: 'What experience do you have that will make you an effective MEET business instructor?' },
      { name: 'teamwork', type: 'text', label: 'Please describe your teamwork, leadership and project management experience. What were your roles, contributions, strengths, and weaknesses?' },
      { name: 'limitations', type: 'text', label: 'If you might have any time limitations this summer, please tell us about them.' },
      { name: 'anything_else', type: 'text', label: 'Anything else you would like to mention? Interests, talents, something you bring to the MEET team?' },
      { name: 'resume_file_name', type: 'paperclip', label: 'Please attach a copy of your resume as a PDF, plain text, or Word document:', attachment: true },
      { name: 'how_hear', type: 'string', label: 'How did you hear about MEET?' },
      { name: 'created_at', type: 'text' },
    ]);
  }
}

module.exports = new Business();
