<template>
<div class="auth-wrapper">
 <div class="auth-card">
  <h2>Crea account</h2>

  <input v-model="user" placeholder="Username / Email">
  <input v-model="pass" type="password" placeholder="Password">
  <input v-model="confirm" type="password" placeholder="Conferma Password">

  <button @click="doRegister">Registrati</button>

  <div class="switch">
   Hai già un account?
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
const user = ref('')
const pass = ref('')
const confirm = ref('')

function doRegister(){
 if(pass.value!==confirm.value) return alert("Le password non coincidono")
 if(!register({email:user.value,password:pass.value}))
  alert("Utente già esistente")
 else router.push('/login')
}
</script>
