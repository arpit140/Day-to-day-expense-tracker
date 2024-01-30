async function signUp(event) {
    event.preventDefault()

    const name = document.getElementById('name').value 
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    try{
        // console.log(name)
        const response =  await axios.post('http://localhost:4000/signup', {
            name: name,
            email: email,
            password: password
        })

        alert (response.data.message)
        document.getElementById('name').value = ''
        document.getElementById('email').value = ''    
        document.getElementById('password').value = ''
    }catch (error) {
        alert(error.response.data.error)
    }
     
}

    
