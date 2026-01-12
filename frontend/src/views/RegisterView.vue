<template>
<div class="chronio-auth">
  <div class="auth-box">
    <div class="auth-logo">CHRONIO</div>

<input v-model="username" type="text" placeholder="Username" />
<input v-model="email" type="email" placeholder="Email" />
<input v-model="password" type="password" placeholder="Password" />
    <input v-model="confirm" type="password" placeholder="Conferma Password">

    <button @click="doRegister">Registrati</button>

    <div class="switch">
      Hai un account?
      <span @click="$router.push('/login')">Accedi</span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { register } from '../auth/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref("")
const email = ref("")
const password = ref("")
const confirm = ref("")

async function doRegister() {
  if (password.value !== confirm.value) {
    alert("Le password non coincidono")
    return
  }

  const success = await register({
    username: username.value,
    email: email.value,
    password: password.value
  })

  if (!success) {
    alert("Utente già esistente")
  } else {
    router.push('/login')
  }
}
</script>