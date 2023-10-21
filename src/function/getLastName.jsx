export const getLastName = (name) => {
    const arr = name.replace('.',' ').split(' ');
    return arr[arr.length - 1].toUpperCase().trim();
}