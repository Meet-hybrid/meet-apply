/**
 * student.js — Student applications (original: app/models/student.rb + config/locales/student.yml).
 *
 * Sections: "Student Information", "Parent Information", "Parental Permission".
 * Fields keep the original names (prefix `_student_`, `_parent_`, `_permission_`)
 * so the section rendering matches the original form.
 */
const { BaseModel } = require('./base');

const CITIES = [
  'Jerusalem', 'Bet Shemesh', 'Bethlehem', 'Mevasseret', 'Ramallah',
  'Nazareth', 'Nazareth Illit',
];

const SCHOOLS = [
  'Al Tour Girls School', 'Amakim Tavor', 'Baptist High School', 'Beit Hinuch', 'Boyer',
  'Branco Vaies', 'Carmel Zvulun', 'Christ Church episcopal school', 'Dar El Tefl el arabi',
  'Dror', 'Franciscan Sisters school', 'Frere high school/ Beit Hanina',
  'Frere high school/ Bethlehem', 'Frere high school/ New Gate', 'Friends school/ Ramallah',
  'Gymnasia', 'Ha-Masorati', 'Haemek Hamaravi Yifat', 'Hanissui', 'Hartman boys',
  'Hartman girls', 'Havat Hanoar', 'HaYovel', 'Ibn khaldon Boys School', 'Ibrahimieh College',
  'Jerusalem School', 'Kadori', 'Keshet', 'Leyada', 'Maften Migdal HaEmek', 'Masar',
  'Mekif Gilo', 'Mgido', 'Misgav high school', 'Motran-St. George school for Boys',
  'Motran-St. Joseph seminary - Nazareth', 'Ort Alon- Afula', 'Ort Givat Ram',
  'Ort Kiryat Tivon', 'Ort Mekif Rogozin', 'Ort Minkuf', 'Ort Moshe Sharet',
  'Ort Oren- Afula', 'Ort Yigal alon', 'Pelech', 'Pisgat Zeav', 'Ras al-amoud- for girls',
  'Rene Kasen', 'Reot', 'Rosary girls school', 'Salesian Sister School - Nazareth',
  'Salvatorian Sisters School', 'Scientific Technological School (Beit Hanina)',
  'Schmidt for girls', 'Seligsberg', 'Shufat boys school', 'Shufat girls School',
  'Sisters of St. Joseph - Nazareth', 'St. Joseph for girls /Old City',
  'St.Joseph/ Bethlehem', 'Talitha Kumi/ Bet Jala', 'Tehila', 'Terra Sancta/ Old City',
  'Terra Santa for boys/ Bethlehem', 'Terra Santa School - Nazareth', 'Vitzo Nahalal',
  'vizo nir haamakim', 'Yearat HaEmek', 'Ziv',
];

class Student extends BaseModel {
  constructor() {
    super('students', [
      // ---- Student Information ----
      { name: '_student_first_name', type: 'string', label: 'First name', section: 'Student Information', required: true },
      { name: '_student_last_name', type: 'string', label: 'Last name', section: 'Student Information', required: true },
      { name: '_student_id_number', type: 'integer', label: 'ID number', section: 'Student Information', required: true, length: 9, unique: true },
      { name: '_student_gender', type: 'string', label: 'Gender', section: 'Student Information', options: ['Male', 'Female'] },
      { name: '_student_birthday', type: 'date', label: 'Birthday', section: 'Student Information' },
      { name: '_student_city', type: 'string', label: 'City', section: 'Student Information', suggest: CITIES },
      { name: '_student_school', type: 'string', label: 'School', section: 'Student Information', suggest: SCHOOLS },
      { name: '_student_address', type: 'string', label: 'Address', section: 'Student Information' },
      { name: '_student_home_phone', type: 'string', label: 'Home phone number', section: 'Student Information' },
      { name: '_student_cell_phone', type: 'string', label: 'Cell phone number', section: 'Student Information' },
      { name: '_student_email', type: 'string', label: 'Email address', section: 'Student Information', required: true, email: true },

      // ---- Parent Information ----
      { name: '_parent_full_name', type: 'string', label: 'Full name', section: 'Parent Information', required: true },
      { name: '_parent_work_phone', type: 'string', label: 'Work phone number', section: 'Parent Information' },
      { name: '_parent_cell_phone', type: 'string', label: 'Cell phone number', section: 'Parent Information' },
      { name: '_parent_email', type: 'string', label: 'Email address', section: 'Parent Information', email: true },

      // ---- Parental Permission ----
      { name: '_permission_to_apply', type: 'boolean', label: 'I authorize my son/daughter\'s application to the MEET program.', section: 'Parental Permission', accept: true },

      { name: 'created_at', type: 'text' },
    ]);
  }
}

module.exports = new Student();
