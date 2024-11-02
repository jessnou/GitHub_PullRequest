    import configuration from '../configuration.js';

    const U = document.querySelector('#u');
    const A = document.querySelector('#a');

    U.className = 'd-none';
    A.className = 'd-none';

    chrome['runtime'].sendMessage(
        {type: 'background:authorized'}, response => {
            if (response.authorized) {
                U.classList.remove('d-none');
            }
            else {
                A.classList.remove('d-none');
            }
        }
    );

    U.querySelector('#logout').addEventListener('click', function (event) {
        event.preventDefault();
        chrome.storage.local.remove(['token']);

        U.className = 'd-none';
        A.className = '';
    });

    A.querySelector('form').addEventListener('submit', function (event) {
        event.preventDefault();

        event.submitter.textBeforeTheChange = event.submitter.innerText;
        event.submitter.disabled = true;
        event.submitter.innerText = event.submitter.getAttribute('data-loading-text');

        let _init = {};
            _init['body'] = new FormData(this);
            _init['method'] = 'POST';

        fetch(configuration.API.URL_CALLBACK('v7_0/api/github-auth'), _init).then(response => response.json())
            .then(
                response => {
                    console.log(response);

                    event.submitter.disabled = false;
                    event.submitter.innerText = event.submitter.textBeforeTheChange;

                    if (typeof response.status === 'undefined') {
                        alert('[0] Произошла ошибка, сервер вернул некорректный ответ.');
                    }
                    else {
                        if (response.status === 200) {
                            chrome.runtime.sendMessage({type: 'background:auth', data: {token: response.data.token}});

                            A.className = 'd-none';
                            U.className = '';
                        }
                        else {
                            if (typeof response.errors === 'undefined') {
                                alert('[1] Произошла ошибка, сервер вернул некорректный ответ.');
                            }
                            else {
                                if (typeof response.errors.login !== 'undefined') {
                                    alert(response.errors.login[0]);
                                }
                                else {
                                    if (typeof response.errors.password !== 'undefined') {
                                        alert(response.errors.password[0]);
                                    }
                                    else {
                                        alert('[2] Произошла ошибка, сервер вернул некорректный ответ.');
                                    }
                                }
                            }
                        }
                    }
                }
            )
            .catch(
                error => {
                    console.error(error);

                    event.submitter.disabled = false;
                    event.submitter.innerText = event.submitter.textBeforeTheChange;

                    alert(String(error.message).slice(0, 256));
                }
            );
    });
