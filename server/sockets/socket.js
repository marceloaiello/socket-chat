const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utils/utilidades')

const usuarios = new Usuarios();


io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {
        //console.log(data);

        if (!data.nombre || !data.sala) {
            return callback({
                err: true,
                mensaje: "El nombre y la sala son requeridos"
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Adminstrador', `${ data.nombre} se unió al chat`));
        callback(usuarios.getPersonasPorSala(data.sala));


        //console.log('usuario conectado', personas);


    });

    client.on('crearMensaje', (data, callback) => {
        // para probar esto desde el navegador : en la consola
        // socket.emit('crearMensaje',{nombre:'jose',mensaje:'Hola a todos desde Marcelo'});

        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        //console.log('persona borrada por desooneccion', personaBorrada);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Adminstrador', `${ personaBorrada.nombre} salió del chat`));
        //console.log('lista personas', usuarios.getPersonasPorSala(personaBorrada.sala));
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));

    });

    //mensajes privados
    client.on("mensajePrivado", data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});