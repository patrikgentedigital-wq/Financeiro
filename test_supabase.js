fetch('https://biloycjmbmmjbmwbgvwn.supabase.co/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: {
    'apikey': 'sb_publishable_IyuMPYnFBA5EM4SMJ6XK0A_ZebDXiau',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'patrickfurtado@gmail.com', password: 'wrongpassword' })
})
.then(res => res.text().then(text => console.log('Status:', res.status, 'Body:', text)))
.catch(err => console.error('Fetch Error:', err));
