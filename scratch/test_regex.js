
const title = "[홍대]부에나클럽 일요성지 보틀20%할인 오늘밤빠";
const match = title.match(/^\[(.*?)\]/);
console.log('Match:', match);
console.log('Neighborhood:', match ? match[1] : 'null');
const replaced = title.replace(/^\[.*?\]/, '');
console.log('Replaced:', replaced);
