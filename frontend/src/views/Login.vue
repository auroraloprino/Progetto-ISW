<template>
  <div class="chronio-auth">
    <div class="auth-box">
      <div class="auth-logo">CHRONIO</div>

      <input v-model="user" placeholder="Username / Email" />
      <input v-model="pass" type="password" placeholder="Password" />

      <button @click="handleLogin">Accedi</button>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="switch">
        Non hai un account?
        <span @click="$router.push('/register')">Registrati</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { login } from "../auth/auth"

const router = useRouter()

const user = ref("")
const pass = ref("")
const errorMsg = ref("")

const handleLogin = async () => {
  errorMsg.value = ""

  if (!user.value || !pass.value) {
    errorMsg.value = "Inserisci username/email e password"
    return
  }

  try {
    const ok = await login(user.value, pass.value) // <-- await FONDAMENTALE
    if (!ok) {
      errorMsg.value = "Credenziali non valide"
      return
    }
    router.push("/calendario")
  } catch (e) {
    console.error(e)
    errorMsg.value = "Errore di connessione"
  }
}
</script>