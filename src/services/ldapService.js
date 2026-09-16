const { authenticate } = require('ldap-authentication');

async function loginWithLDAP(username, password) {
  try {
    // The ldap-authentication library binds with the user's credentials directly
    // based on the userDn we construct.
    const userDn = `uid=${username},ou=users,dc=sec-lab,dc=com`;
    
    const options = {
      ldapOpts: {
        url: process.env.LDAP_URL || 'ldap://localhost:389'
      },
      adminDn: 'cn=admin,dc=sec-lab,dc=com',
      adminPassword: process.env.LDAP_ADMIN_PASSWORD || 'admin123',
      userPassword: password,
      userSearchBase: 'dc=sec-lab,dc=com',
      usernameAttribute: 'uid',
      username: username,
    };
    
    const user = await authenticate(options);
    return { success: true, user };
  } catch (error) {
    console.error('LDAP authentication failed:', error.message);
    return { success: false, error: 'Credenciales inválidas o servidor LDAP inaccesible' };
  }
}

module.exports = {
  loginWithLDAP
};
