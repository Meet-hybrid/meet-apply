/**
 * instructor.js — Summer technical instructor applications (original: app/models/instructor.rb).
 */
const { BaseModel } = require('./base');

class Instructor extends BaseModel {
  constructor() {
    super('instructors', [
      { name: 'first_name', type: 'string', label: 'First name', required: true },
      { name: 'last_name', type: 'string', label: 'Last name', required: true },
      { name: 'email', type: 'string', label: 'Email address', required: true, email: true },
      { name: 'major', type: 'string', label: 'Major(s) or research area', required: true },
      { name: 'status', type: 'string', label: 'MIT affiliation', options: ['Undergraduate', 'Grad student', 'Alumnus/a', 'None'] },
      { name: 'graduation_year', type: 'date', label: 'Undergrad graduation year', yearOnly: true },
      { name: 'why_meet', type: 'text', label: 'Please describe in 300 words why you want to participate in MEET.', required: true },
      { name: 'programming', type: 'text', label: 'Please describe your programming background. Mention programming languages you know, or professional experience you have.' },
      { name: 'teaching', type: 'text', label: 'Please describe any teaching experience you have. What did you find enjoyable? What did you find challenging?' },
      { name: 'teamwork', type: 'text', label: 'Please describe your teamwork, leadership and project management experience. What was your role? Your strengths and weaknesses? What was challenging, and what did you gain?' },
      { name: 'anything_else', type: 'text', label: 'Anything else you would like to mention? Interests, talents, something you bring to the MEET team?' },
      { name: 'resume_file_name', type: 'paperclip', label: 'Please attach a copy of your resume as a PDF or plain text:', attachment: true },
      { name: 'how_hear', type: 'string', label: 'How did you hear about MEET?' },
      { name: 'created_at', type: 'text' },
    ]);
  }
}

module.exports = new Instructor();
