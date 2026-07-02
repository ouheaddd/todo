class Todo {
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTasks: '[data-js-todo-total-task]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckBox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  }

  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
  }

  localStorageKey = 'todo-items'

  constructor() {
    this.rootElement = document.querySelector(this.selectors.root);
    this.newTaskFormElement = this.rootElement.querySelector(this.selectors.newTaskForm);
    this.newTaskInputElement = this.rootElement.querySelector(this.selectors.newTaskInput);
    this.searchTaskFormElement = this.rootElement.querySelector(this.selectors.searchTaskForm);
    this.searchTaskInputElement = this.rootElement.querySelector(this.selectors.searchTaskInput);
    this.totalTasksElement = this.rootElement.querySelector(this.selectors.totalTasks);
    this.deleteAllButtonElement = this.rootElement.querySelector(this.selectors.deleteAllButton);
    this.listElement = this.rootElement.querySelector(this.selectors.list);
    this.emptyMessageElement = this.rootElement.querySelector(this.selectors.emptyMessage);

    this.state = {
      items: this.getItemsFromLocalStorage(),
      filteredItems: null,
      searchQuery: '',
    }

    this.render();
    this.bindEvents();
  }

  getItemsFromLocalStorage() {
    const rawData = localStorage.getItem(this.localStorageKey);

    if (!rawData) {
      return [];
    }

    try {
      const parsedData = JSON.parse(rawData);

      return Array.isArray(parsedData) ? parsedData : [];
    } catch {
      console.error('Error getting items from local storage');
      return [];
    }
  }

  saveItemsToLocalStorage() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.state.items));
  }

  getVisibleItems() {
    return this.state.filteredItems ?? this.state.items;
  }

  render() {
    this.totalTasksElement.textContent = this.state.items.length;

    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible,
      this.state.items.length > 0
    );

    const items = this.getVisibleItems();

    this.listElement.innerHTML = items.map(({ id, title, isChecked }) => `
      <li class="todo__item todo-item" data-js-todo-item>
        <input type="checkbox" class="todo-item__checkbox" id="${id}" ${isChecked ? 'checked' : ''} data-js-todo-item-checkbox>
        <label for="${id}" class="todo-item__label" data-js-todo-item-label>${title}</label>
        <button class="todo-item__delete-button" type="button" aria-label="Delete" title="Delete" data-js-todo-delete-button>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </li>
    `).join('');

    const isEmptyFilteredItems = this.state.filteredItems?.length === 0;
    const isEmptyItems = this.state.items.length === 0;

    this.emptyMessageElement.textContent = isEmptyFilteredItems
      ? 'No items found!'
      : isEmptyItems
        ? 'No items yet!'
        : '';
  }

  addItem(title) {
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    });

    this.saveItemsToLocalStorage();
    this.render();
  }

  deleteItem(id) {
    this.state.items = this.state.items.filter((item) => item.id !== id);

    this.saveItemsToLocalStorage();

    if (this.state.searchQuery.length > 0) {
      this.filter();
    } else {
      this.render();
    }
  }

  toggleCheckedState(id) {
    this.state.items = this.state.items.map((item) => {
      if (item.id === id) {
        return { ...item, isChecked: !item.isChecked };
      }

      return item;
    });

    this.saveItemsToLocalStorage();

    if (this.state.searchQuery.length > 0) {
      this.filter();
    } else {
      this.render();
    }
  }

  filter() {
    const queryFormatted = this.state.searchQuery.toLowerCase();

    this.state.filteredItems = this.state.items.filter(({ title }) => {
      const titleFormatted = title.toLowerCase();

      return titleFormatted.includes(queryFormatted);
    });

    this.render();
  }

  resetFilter() {
    this.state.filteredItems = null;
    this.state.searchQuery = '';
    this.searchTaskInputElement.value = '';

    this.render();
  }

  onNewTaskFormSubmit = (event) => {
    event.preventDefault();

    const newTodoItemTitle = this.newTaskInputElement.value.trim();

    if (newTodoItemTitle.length > 0) {
      this.addItem(newTodoItemTitle);
      this.resetFilter();
      this.newTaskInputElement.value = '';
      this.newTaskInputElement.focus();
    }
  }

  onSearchTaskFormSubmit = (event) => {
    event.preventDefault();
  }

  onSearchTaskInputChange = (event) => {
    const value = event.target.value.trim();

    if (value.length > 0) {
      this.state.searchQuery = value;
      this.filter();
    } else {
      this.resetFilter();
    }
  }

  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Are you sure you want to delete?');

    if (isConfirmed) {
      this.state.items = [];
      this.saveItemsToLocalStorage();
      this.resetFilter();
    }
  }

  onClick = (event) => {
    const deleteButtonElement = event.target.closest(this.selectors.itemDeleteButton);

    if (deleteButtonElement) {
      const itemElement = deleteButtonElement.closest(this.selectors.item);
      const itemCheckboxElement = itemElement.querySelector(this.selectors.itemCheckBox);

      itemElement.classList.add(this.stateClasses.isDisappearing);

      setTimeout(() => {
        this.deleteItem(itemCheckboxElement.id);
      }, 400);
    }
  }

  onChange = (event) => {
    if (event.target.matches(this.selectors.itemCheckBox)) {
      this.toggleCheckedState(event.target.id);
    }
  }

  bindEvents() {
    this.newTaskFormElement.addEventListener('submit', this.onNewTaskFormSubmit);
    this.searchTaskFormElement.addEventListener('submit', this.onSearchTaskFormSubmit);
    this.searchTaskInputElement.addEventListener('input', this.onSearchTaskInputChange);
    this.deleteAllButtonElement.addEventListener('click', this.onDeleteAllButtonClick);
    this.listElement.addEventListener('click', this.onClick);
    this.listElement.addEventListener('change', this.onChange);
  }
}

new Todo();
