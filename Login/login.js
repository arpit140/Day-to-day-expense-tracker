async function login(event) {
    event.preventDefault()
    const email = document.getElementById('email').value 
    const password = document.getElementById('password').value
    // console.log(email)

    try{
        const response = await axios.post('http://localhost:4000/login' , {
            email: email,
            password: password
        })

        alert(response.data.message)
    }catch(error) {
        alert(error.response.data.error)
    }
    
}