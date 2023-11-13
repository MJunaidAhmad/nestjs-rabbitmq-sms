import * as Handlebars from 'handlebars';
import * as HandlebarsHelpers from 'handlebars-helpers';

export function initHandlebarsHelpers() {
  HandlebarsHelpers.comparison({
    handlebars: Handlebars,
  });
  HandlebarsHelpers.math({
    handlebars: Handlebars,
  });

  Handlebars.registerHelper('formatDate', formatDate);
}
const formatDate = (date) => {
  return date.toLocaleString();
};
