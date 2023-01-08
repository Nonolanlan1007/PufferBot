/**
 * @param mail {String} - The email to check.
 * @returns {Boolean} - If the email is valid.
 */
export default function checkMail (mail: string)
{
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail);

}