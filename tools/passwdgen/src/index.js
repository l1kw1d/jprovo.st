import marx from 'marx-css/css/marx.min.css';
import secureRandom from 'secure-random';
import * as secureRandomPassword from 'secure-random-password';

import copyToClipboard from './copy-to-clipboard';
import style from './site.css';

const displayPasswords = ({ getPasswordBoxes, passwordStore, settings }) => {
  settings.error = '';
  try {
    let passwords = passwordStore.passwords;

    for (let [i, box] of getPasswordBoxes().entries()) {
      box.value = passwords[i];
    };
  }
  catch (ex) {
    settings.error = ex.message;

    for (let box of getPasswordBoxes()) {
      box.value = '';
    }
  }
};

const createPasswordStore = ({ settings, numPasswords, onChange }) => ({
  _state: {},

  get passwords() {
    let characters = settings.classes
      .filter(({ enabled }) => enabled)
      .map(({ characters, exactly }) => ({ characters, exactly }));
    let key = JSON.stringify({ characters, length: settings.length });

    if (!this._state.hasOwnProperty(key)) {
      this._state[key] = range(numPasswords)
        .map(() => secureRandomPassword.randomPassword({
          characters,
          length: settings.length,
        }));
    }

    return this._state[key];
  },

  regenerate: function () {
    this._state = {};
    onChange();
  },
});

let classesOnChange = () => { };

const createSettings = (opts) => {
  let classesSettings = createCharacterClassesSetting({ ...opts, onChange: () => { opts.onChange(); classesOnChange(); } });
  let errorSettings = createErrorFeedback(opts);
  let lengthSettings = createLengthSetting({
    ...opts,
    classesSettings,
    subscribeToClassesChange: callback => { classesOnChange = callback }
  });

  return mergeObjects(classesSettings, errorSettings, lengthSettings);
};

const createErrorFeedback = ({ getErrorElement }) => ({
  set error(value) {
    getErrorElement().innerText = value;
  }
});

const createLengthSetting = ({ classesSettings, getLengthElements, onChange, subscribeToClassesChange }) => {
  let settings = {
    get length() {
      let primaryElement = getLengthElements()[0];
      return +primaryElement.value;
    },
    set length(value) {
      for (let elem of getLengthElements()) {
        elem.value = value;
      }
      onChange();
    },
  };

  const updateMin = () => {
    let numClasses = classesSettings.classes
      .filter(({ enabled }) => enabled)
      .length;
    for (let elem of getLengthElements()) {
      elem.min = numClasses;
    }
  };

  subscribeToClassesChange(updateMin);
  updateMin();

  const updateLength = (event) => {
    settings.length = event.target.value;
  }

  for (let elem of getLengthElements()) {
    elem.addEventListener('change', updateLength);
    elem.addEventListener('keyup', updateLength);
  }

  return settings;
};

const createCharacterClassesSetting = ({ getCharacterClassesContainer, onChange }) => {
  const getElements = () => {
    let labels = getCharacterClassesContainer().querySelectorAll('label');
    return Array.from(labels)
      .map(label => ({
        id: label.htmlFor,
        enabledCheckbox: document.getElementById(label.htmlFor),
        label,
        exactly: getItemContainer(label, labels).querySelector('input[type="number"]'),
      }));
  }

  for (let { enabledCheckbox, exactly } of getElements()) {
    enabledCheckbox.addEventListener('change', onChange);
    exactly.addEventListener('change', onChange);
    exactly.addEventListener('keyup', onChange);
  }

  return {
    get classes() {
      let classLabels = getCharacterClassesContainer()
        .querySelectorAll('label');

      return getElements()
        .map(({ enabledCheckbox, exactly, id, label }) => ({
          characters: label.innerText,
          enabled: enabledCheckbox.checked,
          exactly: parseInt(exactly.value),
          id,
        }));
    },
  };
};

const getItemContainer = (item, items) => {
  let lca = getLastCommonAncestor(items);
  return [item, ...getAncestors(item)].find(x => x.parentElement === lca) || item;
}

const getLastCommonAncestor = (elements) => {
  if (elements.length > 0) {
    let [first, ...rest] = elements;

    let restAncestors = rest.map(getAncestors);

    for (let elem of getAncestors(first)) {
      if (restAncestors.every(x => x.includes(elem))) {
        return elem;
      }
    }
  }

  return null;
};

const getAncestors = (elem) =>
  elem.parentElement === null
    ? []
    : [elem.parentElement, ...getAncestors(elem.parentElement)];

const mergeObjects = (...objects) => Object.create(
  Object.prototype,
  Object.assign(...objects.map(obj => Object.getOwnPropertyDescriptors(obj)))
);

const range = n => [...Array(n).keys()];

window.copyToClipboard = copyToClipboard;
window.createPasswordStore = createPasswordStore;
window.createSettings = createSettings;
window.displayPasswords = displayPasswords;
window.secureRandom = secureRandom;
window.secureRandomPassword = secureRandomPassword;
