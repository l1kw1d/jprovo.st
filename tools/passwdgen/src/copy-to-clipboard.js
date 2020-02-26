const copyToClipboard = (clickEvent) => {
  clickEvent.preventDefault();

  let input = null;
  let container = clickEvent.target.parentElement;
  while (input === null && container !== null) {
    input = container.querySelector('input, textarea');
    container = container.parentElement;
  }

  if (input) {
    input.select();
    document.execCommand('copy');
  }

  clickEvent.target.focus();
};

export default copyToClipboard;
