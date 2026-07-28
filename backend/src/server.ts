import app from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
  console.log(`🚀 Mini ERP + CRM Backend API listening on http://localhost:${PORT}`);
});
