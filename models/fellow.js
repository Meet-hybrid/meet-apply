/**
 * fellow.js — MEET Fellowship applications (original: app/models/fellow.rb + locales).
 */
const { BaseModel } = require('./base');

class Fellow extends BaseModel {
  constructor() {
    super('fellows', [
      { name: 'first_name', type: 'string', label: 'First name', required: true },
      { name: 'last_name', type: 'string', label: 'Last name', required: true },
      { name: 'email', type: 'string', label: 'Email address', required: true, email: true },
      { name: 'major', type: 'string', label: 'Major(s) or research area', required: true },
      { name: 'affiliation', type: 'string', label: 'University affiliation', required: true },
      { name: 'why_fellow', type: 'text', label: 'Why do you want to work at MEET as a Fellow?', required: true },
      { name: 'challenges', type: 'text', label: 'In your prior experience teaching or working with students, what were the three greatest challenges? How did you overcome them?' },
      { name: 'role', type: 'text', label: 'When working with excelling or outstanding students, what do you see as the role of the teacher?' },
      { name: 'foreign', type: 'text', label: 'Living in a foreign environment, what challenges and opportunities do you anticipate encountering?' },
      { name: 'mission', type: 'text', label: 'Beyond the teaching aspect of the Fellowship, how do you think you could contribute to the MEET mission?' },
      { name: 'resume_file_name', type: 'paperclip', label: 'Please attach a copy of your resume as a PDF or plain text:', attachment: true },
      { name: 'how_hear', type: 'string', label: 'How did you hear about the MEET Fellowship?' },
      { name: 'created_at', type: 'text' },
    ]);
  }
}

module.exports = new Fellow();
