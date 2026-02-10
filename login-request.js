fetch('https://evo-integracao-api.w12app.com.br/api/v1/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'kaizentraining',
    password: '6A171482-2158-41F4-9AD5-B75C8F46B013'
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
