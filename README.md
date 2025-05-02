# LL1Checker-WebApp
A web app for analyzing LL(1) grammars, simulating parsing steps, and visualizing syntax trees.


# 🐍 FastAPI Backend – LL1Checker

Este es el backend de la aplicación LL1Checker, desarrollado con **FastAPI**.

## 🚀 Cómo ejecutar el backend localmente

### 1. Ir al proyecto

```bash
cd web-app/
cd api/
```

---

### 2. Crear un entorno virtual

```bash
python -m venv env
```

El entorno debe llamarse `env` para que sea ignorado por Git según el `.gitignore`.

---

### 3. Activar el entorno virtual

```bash
env/Scripts/activate
```

---

### 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

---

### 5. Correr el servidor FastAPI

```bash
uvicorn index:app --reload --port 8000
```

Abre en el navegador:

```bash
http://localhost:8000/
```

Deberías recibir:

```json
{ "message": "Hello from FastAPI on Vercel!" }
```


