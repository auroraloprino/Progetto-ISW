<template>
<div class="chronio-auth">
  <div class="auth-box">
    <div class="auth-logo">CHRONIO</div>

    <input v-model="user" placeholder="Username / Email">
    <input v-model="pass" type="password" placeholder="Password">

    <button @click="doLogin">Accedi</button>

    <div class="switch">
      Non hai un account?
      <span @click="$router.push('/register')">Registrati</span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { login } from '../auth/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref('')
const pass = ref('')

function doLogin(){
 if(!login(user.value, pass.value))
  alert("Credenziali errate")
 else router.push('/calendario')
}
</script>
