let groupBtn = document.querySelector('.gh-header-actions');
let employeeSelect;

chrome.runtime.sendMessage(
    {type: 'background:authorized'}, response => {
        initiateAction();
    }
);


async function initiateAction() {
    const token = await getToken();
    const apiUrl = await getApiUrl();

    if (token && apiUrl) {
        await createEmployeeSelect(token, apiUrl);
        await createSendBtn(token, apiUrl);
    }
}

async function getEmployees(token, apiUrl) {
    const formData = new FormData();
    formData.append('token', token);

    try {
        const response = await fetch(`${apiUrl}v7_0/api/github-get-employees`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(errorData);
            return null;
        }

        const data = await response.json();
        return data.employees || [];
    } catch (error) {
        alert('Ошибка при получении сотрудников');
        console.error('Error fetching employees:', error);
        return null;
    }
}

function getToken() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'background:token' }, (response) => {
            resolve(response.token);
        });
    });
}

function getApiUrl() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'background:conf' }, (configuration) => {
            resolve(configuration.API.URL);
        });
    });
}

async function createEmployeeSelect(token, apiUrl) {
    employeeSelect = document.createElement('select');
    employeeSelect.id = 'employeeSelect';
    employeeSelect.className = 'btn btn-sm';
    employeeSelect.appendChild(createOption('0', 'Выберите сотрудника из вашего отдела'));

    employeeSelect.addEventListener('mousedown', async function () {
        if (employeeSelect.options.length > 1) return;
        const employees = await getEmployees(token, apiUrl);

        if (employees) {
            Object.entries(employees).forEach(([value, name]) => {
                employeeSelect.appendChild(createOption(value, name));
            });
        } else {
            alert('Не удалось загрузить сотрудников');
        }
    });

    groupBtn.appendChild(employeeSelect);
}

function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

async function sendData(token, apiUrl) {
    const selectedUser = employeeSelect.value;

    if (!selectedUser || Number(selectedUser) === 0) {
        alert('Пожалуйста, выберите сотрудника!');
        return;
    }

    const prTitle = document.querySelector('.js-issue-title')?.textContent.trim();
    const prUrl = window.location.href;

    console.log('Название PR:', prTitle);
    console.log('URL:', prUrl);
    console.log('Выбранный сотрудник:', selectedUser);

    const formData = new FormData();
    formData.append('token', token);
    formData.append('assignee_id', selectedUser);
    formData.append('name', prTitle);
    formData.append('link', prUrl);

    try {
        const response = await fetch(`${apiUrl}v7_0/api/create-pull-request`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error) {
                const errorMessages = Object.values(errorData.error).flat();

                if (errorMessages.length > 0) {
                    alert(errorMessages[0]);
                } else {
                    alert('Неизвестная ошибка');
                }
            } else {
                alert('Неизвестная ошибка');
            }
            return;
        }

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

async function createSendBtn(token, apiUrl) {
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Создать PR';
    sendBtn.className = 'btn btn-sm';
    sendBtn.style.marginLeft = '8px';

    sendBtn.onclick = () => sendData(token, apiUrl);
    groupBtn.appendChild(sendBtn);
}
