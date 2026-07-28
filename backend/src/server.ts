import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Mini ERP + CRM Backend API listening on http://localhost:${PORT}`);
});