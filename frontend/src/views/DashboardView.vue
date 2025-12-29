<template>
<div class="account-page">


  <div class="auth-box account-box">
    <div class="auth-logo">CHRONIO</div>


    <div class="profile-field">
      <label>USERNAME</label>
      <div class="profile-value">{{user?.email}}</div>
    </div>


    <div class="profile-actions">
      <button @click="logoutAndGo">LOGOUT</button>
    </div>


  </div>


</div>
</template>


<script setup lang="ts">
import { currentUser, logout } from '../auth/auth'
import { useRouter } from 'vue-router'


const router = useRouter()
const user = currentUser()


function logoutAndGo(){
 logout()
 router.push('/login')
}
</script>



