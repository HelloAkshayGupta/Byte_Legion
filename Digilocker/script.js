document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (password.length < 6) {
        alert('Password should be at least 6 characters long');
        return;
    }

    localStorage.setItem('user', JSON.stringify({ name, email, password }));

    alert('Sign Up Successful! Please Sign In.');
    window.location.href = 'signin.html';
});

document.getElementById('signin-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.email === email && user.password === password) {
        alert('Sign In Successful!');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid Credentials');
    }
});
