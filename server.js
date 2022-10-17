const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const app = express();
const port = 3000;

app.use(express.json());

// let url = 'https://api-adresse.data.gouv.fr/search/?q=8+bd+du+port';

// fetch(url)
//   .then(res => res.json()
//   .then(data => console.log(data))
// );

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})