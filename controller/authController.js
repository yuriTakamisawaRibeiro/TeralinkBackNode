const user = require('../db/models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const signup = async (req, res, next) => {
    const body = req.body;

    if (!['1', '2'].includes(body.userType)) {
        return res.status(400).json({
            status: 'fail',
            message: 'User Type inválido'
        });
    }

    try {
        // Criando o novo usuário e esperando a promessa ser resolvida
        const hashedPassword = await bcrypt.hash(body.password, 10); // Criptografa a senha
        const newUser = await user.create({
            userType: body.userType,
            name: body.name,
            email: body.email,
            cpf: body.cpf,
            password: hashedPassword // Armazena a senha criptografada
        });

        // Convertendo o modelo criado em JSON
        const result = newUser.toJSON();

        delete result.password;
        delete result.deletedAt;

        result.token = generateToken({
            id: result.id
        });

        return res.status(201).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            status: 'fail',
            message: 'Erro ao criar usuário.'
        });
    }
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password ) {
        return res.status(400).json({
            status: 'fail',
            message: 'Digite o email ou senha.'
        });
    }

    const result = await user.findOne({where: { email }});
    if(!result || !(await bcrypt.compare(password, result.password))) {
        return res.status(401).json({
            status: 'fail',
            message: 'Email ou senha incorretos.'
        });
    }

    const token = generateToken({
        id: result.id,
    });

    return res.json({
        status: 'success',
        token,
    })


}



module.exports = { signup, login };