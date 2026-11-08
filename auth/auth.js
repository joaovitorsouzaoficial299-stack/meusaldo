import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const supabase=createClient('https://ghfrhesqskqlfsilvrkf.supabase.co','sb_publishable_CXQPbTJfBT1JR-5wmJaWyw_LdwXA3Uo');
const mode=document.body.dataset.mode;
const form=document.querySelector('form'),message=document.getElementById('message'),submit=form.querySelector('button[type="submit"]');
const params=new URLSearchParams(location.search),next=params.get('next');
const safeNext=next&&next.startsWith('/')&&!next.startsWith('//')?next:'/';
const toggle=document.querySelector('.password-toggle');
if(toggle){toggle.addEventListener('click',()=>{const field=form.elements.namedItem('password');const visible=field.type==='password';field.type=visible?'text':'password';toggle.setAttribute('aria-pressed',String(visible));toggle.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha')})}
const session=await supabase.auth.getSession();
if(session.data.session&&mode==='login')location.replace(safeNext);
form.addEventListener('submit',async e=>{
 e.preventDefault();submit.disabled=true;message.textContent='Aguarde...';
 const email=form.elements.namedItem('email').value.trim(),password=form.elements.namedItem('password')?.value;
 try{
  let result;
  if(mode==='signup'){
   const nickname=form.elements.namedItem('nickname').value.trim().replace(/\s+/g,' ');
   if(nickname.length<2||nickname.length>40)throw Error('Informe um apelido de 2 a 40 caracteres.');
   if(password.length<8)throw Error('A senha precisa ter pelo menos 8 caracteres.');
   result=await supabase.auth.signUp({email,password,options:{data:{nickname,full_name:nickname},emailRedirectTo:location.origin+'/login/'}});
   if(result.error)throw result.error;
   if(result.data.session&&result.data.user){
    const {error:profileError}=await supabase.from('profiles').upsert({id:result.data.user.id,full_name:nickname},{onConflict:'id'});
    if(profileError)console.warn('Não foi possível sincronizar o apelido:',profileError.message);
    message.textContent='Conta criada com sucesso! Você já pode continuar.';
   }else{message.textContent='Cadastro recebido. Se o sistema solicitar, confira seu e-mail para concluir.'}
  }else if(mode==='recover'){
   result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/login/'});
   if(result.error)throw result.error;
   message.textContent='Se este e-mail estiver cadastrado, enviaremos as instruções.';
  }else{
   result=await supabase.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   location.replace(safeNext);
  }
 }catch(err){message.textContent=err.message||'Não foi possível continuar. Tente novamente.'}
 finally{submit.disabled=false}
});