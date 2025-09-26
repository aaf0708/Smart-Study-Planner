const studyData = {
  streak: 9,
  avgTime: '40 min',
  weekly: [4,5,6,4,7,5,6],
  badges: ['7-Day Streak','On-Time Finisher','Night Owl']
};
const choresData = {
  streak: 6,
  avgTime: '25 min',
  weekly: [2,3,4,3,5,4,4],
  badges: ['Weekend Warrior','Speed Cleaner']
};

function renderProgress(prefix, data, color){
  document.getElementById(`${prefix}-streak`).textContent = `${data.streak} days`;
  document.getElementById(`${prefix}-avg`).textContent = data.avgTime;

  new Chart(document.getElementById(`${prefix}Chart`), {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label: 'Tasks Completed',
        data: data.weekly,
        backgroundColor: color
      }]
    },
    options: {
      responsive:true,
      scales: { y: { beginAtZero:true, ticks:{ stepSize:1 } } },
      plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-dark') } } }
    }
  });

  const grid = document.getElementById(`${prefix}-badges`);
  data.badges.forEach(b=>{
    const div=document.createElement('div');
    div.className='badge' + (prefix==='chores' ? ' badge-chores':'');
    div.textContent=b;
    grid.appendChild(div);
  });
}

renderProgress('study', studyData, '#4f46e5');
renderProgress('chores', choresData, '#10b981');

const toggleBtn = document.getElementById('darkToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.body.classList.add('dark');

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});