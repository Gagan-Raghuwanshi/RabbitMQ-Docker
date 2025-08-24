exports.sendWelcomeEmail = async (userData) => {
    console.log(`Sending welcome email to ${userData.email} (${userData.name})`);
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Welcome email sent to ${userData.email}`);
            resolve();
        }, 1000);
    });
}
