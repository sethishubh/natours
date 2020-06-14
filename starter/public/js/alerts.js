//Below-> Disabling ES-Lint for this entire file coz ES-Lint is configured for Node.Js and NOT for JS code
/* eslint-disable */

//Below's "const showAlert = .... f'n" is going to create a very simple alert based on type and method, but now we actually also want a function for hiding alerts. So creating hideAlert f'n just below
export const hideAlert = () => {
  //Below-> So now all we're gonna do is to select the element with the '.alert' class and then after that remove it.
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};

//Below-> type (in (type, msg) ) is 'success' or 'error' . Because depending on this input(ie (type, msg) ) we will then have different CSS for each of these alerts
//Contd.. So below what we're gonna do is to basically create some HTML markup here and then insert that into our HTML,
//Contd.. Coz we have different CSS Classes in Style.css file -> .alert--success and .alert--error
export const showAlert = (type, msg) => {
  //Below calling hideAlert() f'n coz what I want to do here below now is to whenever we show an alert first hide all the alerts that already exist. So we always, just to make sure always run hideAlert f'n.
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  //Below-> document.querySelector('select the element where we want to include this HTML that we just created above in const markup = .... . So that's actually right at the beginning of the body element. So right at the top of the page. So body.')
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  //Above-> afterbegin -> means inside of the body, but right at the beginning. ; markup -> HTML we want to include

  //Below-> hide all the alerts after five seconds(ie 5000ms).
  window.setTimeout(hideAlert, 5000);
};
