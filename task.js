const tasks = [];
function addTask(){
  const name=document.getElementById('taskName').value.trim();
  if(!name) return;
  const priority=document.getElementById('taskPriority').value;
  const hardness=document.getElementById('taskHardness').value;
  tasks.push({name,priority,hardness});
  updateTaskList();
  document.getElementById('taskName').value='';
}
function updateTaskList(){
  const ul=document.getElementById('tasksList'); ul.innerHTML='';
  tasks.forEach((t,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`${t.name} (${t.priority}, ${t.hardness})
       <button onclick="removeTask(${i})">Delete</button>`;
    ul.appendChild(li);
  });
}
function removeTask(i){tasks.splice(i,1);updateTaskList();}

document.getElementById('wantBreaks').addEventListener('change', e=>{
  document.getElementById('breakConfig').style.display = e.target.checked?'block':'none';
  updateBreakInputs();
});
document.getElementById('numBreaks').addEventListener('input', updateBreakInputs);
function updateBreakInputs(){
  const container=document.getElementById('breakLengths');
  container.innerHTML='';
  const n=parseInt(document.getElementById('numBreaks').value)||0;
  for(let i=1;i<=n;i++){
    const input=document.createElement('input');
    input.type='number'; input.min='1'; input.placeholder=`Break ${i} (min)`;
    input.className='breakLen';
    container.appendChild(input);
  }
}

function generateSchedule(){
  const errorBox=document.getElementById('errorBox');
  errorBox.style.display='none'; errorBox.textContent='';
  const availableTime=parseInt(document.getElementById('availableTime').value);
  const numDays=parseInt(document.getElementById('numDays').value);
  const type=document.querySelector('input[name="scheduleType"]:checked').value;

  if(type==='single' && (!availableTime||availableTime<=0)){
    errorBox.textContent='Enter available time for single-day schedule.'; errorBox.style.display='block'; return;
  }
  if(type==='multi' && (!numDays||numDays<1)){
    errorBox.textContent='Enter a valid number of days.'; errorBox.style.display='block'; return;
  }
  if(tasks.length===0){
    errorBox.textContent='Please add at least one task.'; errorBox.style.display='block'; return;
  }

  // Breaks
  let breakLengths=[];
  if(document.getElementById('wantBreaks').checked){
    document.querySelectorAll('.breakLen').forEach(inp=>{
      const val=parseInt(inp.value);
      if(!val||val<=0){ errorBox.textContent='Enter valid break lengths.'; errorBox.style.display='block'; }
      breakLengths.push(val);
    });
  }
  const totalBreak = breakLengths.reduce((a,b)=>a+b,0);

  const scheduleContainer=document.getElementById('scheduleContainer');
  scheduleContainer.innerHTML='';

  const totalWeight = tasks.reduce((sum,t)=>{
    const p={High:3,Medium:2,Low:1}[t.priority];
    const h={Hard:3,Medium:2,Easy:1}[t.hardness];
    return sum+p+h;
  },0);

  function createDay(label, dayTime){
    const div=document.createElement('div');
    div.className='schedule';
    div.innerHTML=`<h3>${label}</h3>
      <button class="edit-container-btn" onclick="toggleEdit(this)">Edit Tasks</button>
      <table><thead>
        <tr><th>Start</th><th>End</th><th>Activity</th><th>Priority</th><th>Hardness</th><th>Time(min)</th></tr>
      </thead><tbody></tbody></table>`;
    const tbody=div.querySelector('tbody');

    const maxDay = dayTime || 480;
    if(totalBreak >= maxDay){
      errorBox.textContent=`Break time (${totalBreak} min) exceeds available day time (${maxDay} min). Adjust inputs.`;
      errorBox.style.display='block';
      return;
    }
    const studyTime = maxDay - totalBreak;
    const chunk = studyTime/totalWeight;
    let current = 8*60;
    let breakIndex=0;

    tasks.forEach((t)=>{
      const weight={High:3,Medium:2,Low:1}[t.priority]+{Hard:3,Medium:2,Easy:1}[t.hardness];
      const duration=Math.round(chunk*weight);
      addRow(t.name,t.priority,t.hardness,duration);
      maybeBreak();
    });

    function addRow(name,p,h,d){
      const sH=Math.floor(current/60), sM=current%60;
      current+=d;
      const eH=Math.floor(current/60), eM=current%60;
      tbody.innerHTML+=`<tr>
        <td>${pad(sH)}:${pad(sM)}</td>
        <td>${pad(eH)}:${pad(eM)}</td>
        <td class="editable-name">${name}</td>
        <td class="editable-priority">${p}</td>
        <td class="editable-hardness">${h}</td>
        <td>${d}</td></tr>`;
    }
    function maybeBreak(){
      if(breakIndex<breakLengths.length){
        const len=breakLengths[breakIndex++];
        const sH=Math.floor(current/60), sM=current%60;
        current+=len;
        const eH=Math.floor(current/60), eM=current%60;
        tbody.innerHTML+=`<tr class="break-row">
          <td>${pad(sH)}:${pad(sM)}</td>
          <td>${pad(eH)}:${pad(eM)}</td>
          <td colspan="4"><strong>Break (${len} min)</strong></td></tr>`;
      }
    }

    const timeline = document.createElement('div');
    timeline.className = 'day-timeline';
    div.appendChild(timeline);
    scheduleContainer.appendChild(div);

    renderTimeline(tbody, timeline);
  }

  if(type==='single'){ createDay('Single Day Schedule', availableTime); }
  else { for(let d=1; d<=numDays; d++) createDay(`Day ${d}`, availableTime||null); }

  tasks.length=0; updateTaskList();
}

function renderTimeline(tbody, container) {
  const toMin = str => {
    const [h,m] = str.split(':').map(Number);
    return h*60 + m;
  };
  const items = [];
  tbody.querySelectorAll('tr').forEach(tr=>{
    if(tr.classList.contains('break-row')) return;
    const tds = tr.querySelectorAll('td');
    items.push({
      start: toMin(tds[0].textContent.trim()),
      end:   toMin(tds[1].textContent.trim()),
      name:  tds[2].textContent.trim(),
      priority: tds[3].textContent.trim()
    });
  });
  if(!items.length) return;

  const minStart = items[0].start;
  const maxEnd   = items[items.length-1].end;
  const total    = maxEnd - minStart;

  items.forEach(it=>{
    const left  = ((it.start - minStart)/total)*100;
    const width = ((it.end   - it.start)/total)*100;
    const priorityClass = it.priority.toLowerCase(); 
    const block = document.createElement('div');
    block.className = 'timeline-block ' + priorityClass;
    block.style.left  = left + '%';
    block.style.width = width + '%';
    block.textContent = it.name;
    container.appendChild(block);
  });
}

function pad(n){return String(n).padStart(2,'0');}

function toggleEdit(btn){
  const schedule=btn.closest('.schedule');
  const editing = btn.textContent==='Save Changes';
  const nameCells=schedule.querySelectorAll('.editable-name');
  const pCells=schedule.querySelectorAll('.editable-priority');
  const hCells=schedule.querySelectorAll('.editable-hardness');
  if(!editing){
    nameCells.forEach(td=>td.innerHTML=`<input value="${td.textContent}" style="width:90%">`);
    pCells.forEach(td=>td.innerHTML=sel(td.textContent,['High','Medium','Low']));
    hCells.forEach(td=>td.innerHTML=sel(td.textContent,['Hard','Medium','Easy']));
    btn.textContent='Save Changes';
  } else {
    nameCells.forEach(td=>td.textContent=td.querySelector('input').value);
    pCells.forEach(td=>td.textContent=td.querySelector('select').value);
    hCells.forEach(td=>td.textContent=td.querySelector('select').value);
    btn.textContent='Edit Tasks';
  }
  function sel(cur,opts){
    return `<select>${opts.map(o=>`<option ${o===cur?'selected':''}>${o}</option>`).join('')}</select>`;
  }
}

document.getElementById('toggleMode').addEventListener('click',()=>{
  document.body.classList.toggle('dark-mode');
  document.getElementById('toggleMode').textContent=
    document.body.classList.contains('dark-mode')?'Light Mode':'Dark Mode';
});

const aboutLink   = document.getElementById('breakLink');
const aboutModal  = document.getElementById('breakModal');
const closeAbout  = document.getElementById('closeBreak');

aboutLink.addEventListener('click', e => {
  e.preventDefault();
  breakModal.classList.add('show');
});
closeAbout.addEventListener('click', () => breakModal.classList.remove('show'));
breakModal.addEventListener('click', e => { if (e.target === breakModal) breakModal.classList.remove('show'); });

document.getElementById("addReminderBtn").addEventListener("click", () => {
  const form = document.getElementById("reminderForm");
  form.style.display = form.style.display === "block" ? "none" : "block";
});

document.getElementById("saveReminder").addEventListener("click", () => {
  const title = document.getElementById("reminderTitle").value.trim();
  const date = document.getElementById("reminderDate").value;
  const time = document.getElementById("reminderTime").value;
  if (!title || !date || !time) return;

  const id = Date.now().toString();
  reminders.push({ id, title, date, time });

  document.getElementById("reminderTitle").value = "";
  document.getElementById("reminderDate").value = "";
  document.getElementById("reminderTime").value = "";
  document.getElementById("reminderForm").style.display = "none";

  renderReminders();
});

function renderReminders() {
  const list = document.getElementById("reminderList");
  list.innerHTML = "";
  reminders.forEach(r => {
    const div = document.createElement("div");
    div.className = "reminder-box";
    div.innerHTML = `
      <input type="checkbox" onchange="completeReminder('${r.id}')">
      <div>
        <strong>${r.title}</strong>
        <small>${r.date} • ${r.time}</small>
      </div>`;
    list.appendChild(div);
  });
}

window.completeReminder = id => {
  reminders = reminders.filter(r => r.id !== id);
  renderReminders();
};
