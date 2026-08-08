/**
 * form_fields.js — turns model column metadata into render-ready field objects,
 * mirroring the original app_input() helper in apply_helper.rb.
 *
 * Field kinds:
 *   input    → <input type="text">       (string/integer, free answer)
 *   select   → <select> from fixed options  (inclusion validator)
 *   suggest  → <select> suggestions + '-Other-' (presence-with-suggest validator)
 *   textarea → long answer
 *   checkbox → boolean
 *   date     → <input type="date">
 *   year     → <select> of years (columns named *_year)
 *   file     → resume upload (paperclip)
 */
function buildFields(appClass, values, errors) {
  return appClass.formColumns().map((c) => {
    const field = {
      name: c.name,
      label: appClass.labelOf(c),
      type: c.type,
      value: values ? values[c.name] : undefined,
      error: errors ? errors[c.name] : null,
      section: c.section || null,
      required: !!c.required || !!c.accept,
    };

    if (c.options) {
      field.kind = 'select';
      field.options = c.options;
    } else if (c.suggest) {
      field.kind = 'suggest';
      field.options = [...c.suggest, '-Other-'];
    } else if (c.type === 'text') {
      field.kind = 'textarea';
    } else if (c.type === 'boolean') {
      field.kind = 'checkbox';
    } else if (c.type === 'paperclip') {
      field.kind = 'file';
    } else if (c.type === 'date') {
      field.kind = c.yearOnly ? 'year' : 'date';
    } else {
      field.kind = 'input';
    }
    return field;
  });
}

/** Year options for *_year selects (original: start_year year-15, end_year year+10). */
function yearOptions(now = new Date()) {
  const start = now.getFullYear() - 15;
  const end = now.getFullYear() + 10;
  const years = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}

module.exports = { buildFields, yearOptions };
