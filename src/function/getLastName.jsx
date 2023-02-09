export const getLastName = (name) => {
    const arr = name.split(' ');
    return arr[arr.length - 1].toUpperCase().trim();
}