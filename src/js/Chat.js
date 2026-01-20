import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.currentUser = null;

    this.renderLoginModal();
  }

  init() {
    this.registerEvents();
  }

  renderLoginModal() {
    this.container.innerHTML = `
      <div class="modal__form active">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Выберите псевдоним</div>
          <div class="modal__body">
            <form id="login-form" class="form">
              <div class="form__group">
                <input type="text" class="form__input" id="nickname-input" required autocomplete="off" />
                <div class="form__hint" id="login-hint"></div>
              </div>
            </form>
          </div>
          <div class="modal__footer">
            <button type="submit" form="login-form" class="modal__ok">Продолжить</button>
          </div>
        </div>
      </div>
    `;
  }

  renderChat() {
    this.container.innerHTML = `
      <div class="container">
        <div class="chat__container">
          <!-- Левая панель с сотрудниками -->
          <div class="chat__employees-sidebar" id="employees-list">
            <div class="chat__employees-header">Employees</div>
          </div>
          
          <!-- Правая панель с чатом -->
          <div class="chat__area">
            <div class="chat__messages-container" id="messages-list">
            </div>
            <div class="chat__messages-input">
              <form id="message-form" style="width: 100%;">
                <div class="form__group">
                  <input type="text" id="message-input" 
                         class="form__input" 
                         placeholder="Type your message..." 
                         autocomplete="off" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  registerEvents() {
    // Обработка отправки формы входа
    this.container.addEventListener('submit', (e) => {
      if (e.target.id === 'login-form') {
        e.preventDefault();
        this.onEnterChatHandler();
      } else if (e.target.id === 'message-form') {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Обработка нажатия Enter в инпутах
    this.container.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.id === 'nickname-input') {
        e.preventDefault();
        this.onEnterChatHandler();
      }
    });
  }

  async onEnterChatHandler() {
    const input = document.getElementById('nickname-input');
    const hint = document.getElementById('login-hint');
    const nickname = input?.value?.trim();
  
    if (!nickname) {
      if (hint) hint.textContent = 'Nickname cannot be empty';
      return;
    }
    
    const result = await this.api.registerUser(nickname);
  
    if (result?.ok && result.data?.status === 'ok') {
      this.currentUser = result.data.user;
      this.renderChat();
      this.connectWebSocket();
      window.addEventListener('beforeunload', () => this.sendExit());
    } else {
      const msg = result?.data?.message || 'Registration failed';
      if (hint) hint.textContent = msg;
    }
  }

  connectWebSocket() {
    this.websocket = new WebSocket('ws://localhost:3000');
  
    this.websocket.onopen = () => {
      console.log('✅ WebSocket connected to backend');
    };
  
    this.websocket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Invalid JSON from server:', event.data);
        return;
      }
  
      if (Array.isArray(data)) {
        this.updateUserList(data);
      } else if (data.type === 'send') {
        this.renderMessage(data);
      }
    };
  
    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket connection error:', error);
    };
  }

  updateUserList(users) {
    const employeesListEl = document.getElementById('employees-list');
    if (!employeesListEl) {
      console.warn('Employees list container not found');
      return;
    }
    
    // Сохраняем заголовок, остальное очищаем
    employeesListEl.innerHTML = '<div class="chat__employees-header">Employees</div>';
    
    if (users.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'employee__container';
      emptyEl.textContent = 'No employees online';
      employeesListEl.append(emptyEl);
      return;
    }
    
    // Добавляем текущего пользователя первым
    if (this.currentUser) {
      const currentUserEl = document.createElement('div');
      currentUserEl.className = 'employee__container';
      currentUserEl.innerHTML = `
        <div class="employee__name">You (${this.currentUser.name})</div>
        <div class="employee__status employee__status-online">● Online</div>
      `;
      employeesListEl.append(currentUserEl);
    }
    
    // Добавляем остальных пользователей
    users.forEach(user => {
      // Пропускаем текущего пользователя, если он уже добавлен
      if (this.currentUser && user.id === this.currentUser.id) {
        return;
      }
      
      const employeeEl = document.createElement('div');
      employeeEl.className = 'employee__container';
      employeeEl.innerHTML = `
        <div class="employee__name">${user.name}</div>
        <div class="employee__status employee__status-online">● Online</div>
      `;
      employeesListEl.append(employeeEl);
    });
    
    // Добавляем время последнего обновления
    const timeEl = document.createElement('div');
    timeEl.className = 'employee__status';
    timeEl.style.marginTop = '15px';
    timeEl.style.fontSize = '11px';
    timeEl.style.textAlign = 'center';
    timeEl.textContent = `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    employeesListEl.append(timeEl);
  }

  renderMessage(msg) {
    const messagesContainer = document.getElementById('messages-list');
    const isOwn = this.currentUser && msg.user.id === this.currentUser.id;
  
    const messageEl = document.createElement('div');
    messageEl.className = isOwn
      ? 'message__container message__container-yourself'
      : 'message__container message__container-interlocutor';
  
    // Форматируем время
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
    messageEl.innerHTML = `
      <div class="message__header">${isOwn ? 'You' : msg.user.name}</div>
      <div>${msg.message}</div>
      <div class="message__time">${timeString}</div>
    `;
  
    messagesContainer.append(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendMessage() {
    const input = document.getElementById('message-input');
    const text = input?.value?.trim();
    if (!text || !this.currentUser) return;
  
    // Проверка состояния WebSocket
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not ready. Current state:', this.websocket?.readyState);
      // Опционально: можно показать уведомление пользователю
      return;
    }
  
    const payload = {
      type: 'send',
      message: text,
      user: this.currentUser,
    };
  
    this.websocket.send(JSON.stringify(payload));
    input.value = '';
  }

  sendExit() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.currentUser) {
      this.websocket.send(
        JSON.stringify({
          type: 'exit',
          user: this.currentUser,
        })
      );
    }
  }
}