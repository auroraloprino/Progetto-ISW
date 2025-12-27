<template>
<div class="auth-wrapper">
 <div class="auth-card">
  <h2>Area privata</h2>
  <p>Benvenuto {{user?.email}}</p>
  <button @click="doLogout">Logout</button>
 </div>
</div>
</template>

<script setup lang="ts">
import { currentUser, logout } from '../auth/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = currentUser()

function doLogout(){
 logout()
 router.push('/login')
}
</script>
