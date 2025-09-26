let tasks = [];
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const chartCtx = document.getElementById('progressChart').getContext('2d');

// Gradient for the ring
const gradient = chartCtx.createLinearGradient(0, 0, 0, 180);
gradient.addColorStop(0, '#34d399'); 
gradient.addColorStop(1, '#10b981'); 

let donut = new Chart(chartCtx, {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [0, 100],                 
      backgroundColor: [gradient, '#e5e7eb'], 
      borderWidth: 0
    }]
  },
  options: {
    cutout: '75%',                    
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  },
  plugins: [{
    id: 'centerText',
    afterDraw(chart) {
      const {ctx, chartArea: {width, height}} = chart;
      const total = tasks.reduce((a,b) => a + b.duration, 0);
      const done  = tasks.filter(t => t.completed).reduce((a,b) => a + b.duration, 0);
      const pct   = total ? Math.round((done/total)*100) : 0;

      ctx.save();
      ctx.font = 'bold 22px Segoe UI';
      ctx.fillStyle = '#10b981';      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pct}%`, width/2, height/2);
      ctx.restore();
    }
  }]
});



function updateChart() {
  const total = tasks.reduce((a,b) => a + b.duration, 0);
  const done  = tasks.filter(t => t.completed).reduce((a,b) => a + b.duration, 0);
  const pct   = total ? (done/total)*100 : 0;

  donut.data.datasets[0].data = [pct, 100 - pct];
  donut.update();
}


function renderTasks(){
  const list=document.getElementById('tasksList'); list.innerHTML='';
  tasks.forEach(t=>{
    const li=document.createElement('li'); li.className='task'; li.dataset.id=t.id;
    li.innerHTML=`<div>
        <input type="checkbox" ${t.completed?'checked':''} onchange="toggleDone('${t.id}')">
        <strong>${t.name}</strong>
        <div class="task-meta">${t.duration} min • ${t.priority} • ${t.hardness}
          • <span class="chip ${t.category}">${t.category}</span>
        </div>
      </div>
      <button onclick="delTask('${t.id}')" class="btn ghost" style="padding:4px 8px;font-size:12px">✕</button>`;
    list.appendChild(li);
  });
  Sortable.create(list,{animation:150,onEnd:()=>{
    const order=[...list.children].map(li=>li.dataset.id);
    tasks.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  }});
  updateChart();
}

window.toggleDone=id=>{
  tasks=tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t);
  renderTasks(); renderSchedule();
};
window.delTask=id=>{
  tasks=tasks.filter(t=>t.id!==id);
  renderTasks();
};

document.getElementById('addTaskBtn').addEventListener('click',()=>{
  const name=document.getElementById('taskName').value.trim();
  const dur=parseInt(document.getElementById('taskDuration').value);
  if(!name||!dur) return;
  tasks.push({id:uid(),name,duration:dur,
              priority:document.getElementById('taskPriority').value,
              category:document.getElementById('taskCategory').value,
              hardness:document.getElementById('taskHardness').value,
              completed:false});
  document.getElementById('taskName').value='';
  document.getElementById('taskDuration').value='';
  renderTasks();
});

document.getElementById('autoSchedule').addEventListener('click',()=>{
  const start=document.getElementById('dayStart').value||'08:00';
  const totalMin=parseInt(document.getElementById('availableTime').value)||480;
  const startMins=parseInt(start.split(':')[0])*60+parseInt(start.split(':')[1]);
  const weight=t=>({High:3,Medium:2,Low:1}[t.priority]+{Hard:3,Medium:2,Easy:1}[t.hardness]);
  const ordered=[...tasks].sort((a,b)=>weight(b)-weight(a));
  let used=0,current=startMins;
  ordered.forEach(t=>{t.start=current;t.end=current+t.duration;current+=t.duration;used+=t.duration;});
  if(used>totalMin){
    document.getElementById('conflictBox').textContent=
      `⚠ Planned time (${used} min) exceeds available (${totalMin} min).`;
    document.getElementById('conflictBox').style.display='block';
    return;
  }
  document.getElementById('tasksList').style.display='none';

  document.getElementById('scheduleCard').style.display='block';
  renderSchedule();
});

function renderSchedule(editMode=false){
  const container=document.getElementById('scheduleTable'); container.innerHTML='';
  if(tasks.length===0){container.textContent='No tasks scheduled.';return;}
  const table=document.createElement('table');
  const headers=`<thead><tr>
      <th>Done</th><th>Start</th><th>End</th>
      <th>Task</th><th>Priority</th><th>Duration</th>
    </tr></thead>`;
  table.innerHTML=headers;
  const tbody=document.createElement('tbody');
  tasks.forEach(t=>{
    if(t.start==null) return;
    const tr=document.createElement('tr');
    const rowClass=t.priority==='High'?'row-high':t.priority==='Medium'?'row-medium':'row-low';
    tr.className=rowClass;
    const taskCell = editMode ?
      `<input data-edit="name" data-id="${t.id}" value="${t.name}" style="width:90%">` :
      t.name;
    const durCell = editMode ?
      `<input data-edit="duration" data-id="${t.id}" type="number" value="${t.duration}" style="width:70px">` :
      `${t.duration} min`;
    const priCell = editMode ?
      `<select data-edit="priority" data-id="${t.id}">
        <option ${t.priority==='High'?'selected':''}>High</option>
        <option ${t.priority==='Medium'?'selected':''}>Medium</option>
        <option ${t.priority==='Low'?'selected':''}>Low</option>
      </select>` : t.priority;
    tr.innerHTML=`<td><input type="checkbox" ${t.completed?'checked':''} onchange="toggleDone('${t.id}')"></td>
      <td>${toTime(t.start)}</td><td>${toTime(t.end)}</td>
      <td>${taskCell}</td><td>${priCell}</td><td>${durCell}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

document.getElementById('toggleEditBtn').addEventListener('click',()=>{
  const btn=document.getElementById('toggleEditBtn');
  const editing=btn.dataset.mode==='edit';
  if(!editing){
    btn.textContent='Save Changes';
    btn.dataset.mode='edit';
    renderSchedule(true);
  }else{
    document.querySelectorAll('[data-edit]').forEach(el=>{
      const id=el.dataset.id;
      tasks=tasks.map(t=>{
        if(t.id!==id) return t;
        if(el.dataset.edit==='name')   t.name = el.value;
        if(el.dataset.edit==='duration') t.duration = parseInt(el.value)||t.duration;
        if(el.dataset.edit==='priority') t.priority = el.value;
        return t;
      });
    });
    document.getElementById('autoSchedule').click();
    btn.textContent='Edit Schedule';
    btn.dataset.mode='';
  }
});

function toTime(mins){const h=Math.floor(mins/60),m=mins%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}

document.getElementById('toggleMode').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.getElementById('toggleMode').textContent =
    document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});
