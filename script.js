
"use strict";

const $ = (id) => document.getElementById(id);

function ipv4ToInt(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    value = (value * 256 + n) >>> 0;
  }
  return value >>> 0;
}

function intToIPv4(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ].join(".");
}

function calculateSubnet() {
  const ipText = $("ip").value;
  const ip = ipv4ToInt(ipText);
  const prefix = Number($("cidr").value);
  const message = $("calc-message");

  if (ip === null) {
    message.textContent = "Adresse IPv4 invalide. Exemple : 192.168.1.10";
    return;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix <= 30 ? Math.max(0, total - 2) : prefix === 31 ? 2 : 1;
  const first = prefix <= 30 ? network + 1 : network;
  const last = prefix <= 30 ? broadcast - 1 : broadcast;

  const values = [
    intToIPv4(network),
    intToIPv4(mask),
    intToIPv4(broadcast),
    usable.toLocaleString("fr-FR"),
    intToIPv4(first >>> 0),
    intToIPv4(last >>> 0)
  ];

  $("results").querySelectorAll("strong").forEach((el, i) => {
    el.textContent = values[i];
  });

  message.textContent = "Calcul terminé. Préfixe IPv4 : /" + prefix;
}

$("calculate").addEventListener("click", calculateSubnet);
$("ip").addEventListener("keydown", (e) => {
  if (e.key === "Enter") calculateSubnet();
});
$("cidr").addEventListener("change", calculateSubnet);
calculateSubnet();

const missions = [
  {
    q: "Quelle est l'adresse IPv4 de loopback la plus utilisée ?",
    a: ["192.168.1.1", "127.0.0.1", "8.8.8.8", "255.255.255.0"],
    correct: 1,
    info: "127.0.0.1 permet à une machine de communiquer avec elle-même."
  },
  {
    q: "Quel service traduit les noms de domaine en adresses IP ?",
    a: ["DHCP", "FTP", "DNS", "SSH"],
    correct: 2,
    info: "DNS associe les noms de domaine aux adresses IP."
  },
  {
    q: "Quel masque correspond au préfixe /24 ?",
    a: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.252"],
    correct: 2,
    info: "Un /24 correspond au masque 255.255.255.0."
  },
  {
    q: "Quelle commande Linux affiche le répertoire courant ?",
    a: ["ls", "pwd", "mkdir", "whoami"],
    correct: 1,
    info: "pwd affiche le chemin du répertoire courant."
  },
  {
    q: "Quel service distribue automatiquement les adresses IP ?",
    a: ["DNS", "HTTP", "DHCP", "SMTP"],
    correct: 2,
    info: "DHCP attribue automatiquement les paramètres IP aux clients."
  }
];

let current = 0;
let xp = 0;
let completed = 0;
let answered = false;

function renderMission() {
  const mission = missions[current];
  answered = false;
  $("question").textContent = mission.q;
  $("mission-count").textContent = `${current + 1} / ${missions.length}`;
  $("progress-bar").style.width = `${(current / missions.length) * 100}%`;
  $("feedback").textContent = "";
  $("next").disabled = true;
  $("next").classList.remove("hidden");
  $("restart").classList.add("hidden");
  $("answers").replaceChildren();

  mission.a.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = answer;
    button.addEventListener("click", () => chooseAnswer(index));
    $("answers").appendChild(button);
  });
}

function chooseAnswer(index) {
  if (answered) return;
  answered = true;

  const mission = missions[current];
  const buttons = [...$("answers").querySelectorAll("button")];
  buttons.forEach((button, i) => {
    button.disabled = true;
    if (i === mission.correct) button.classList.add("correct");
  });

  if (index === mission.correct) {
    xp += 100;
    completed++;
    $("feedback").textContent = "✓ Bonne réponse ! " + mission.info;
    $("feedback").style.color = "var(--green)";
  } else {
    buttons[index].classList.add("wrong");
    $("feedback").textContent = "✗ Pas tout à fait. " + mission.info;
    $("feedback").style.color = "var(--red)";
  }

  $("xp").textContent = xp;
  $("level").textContent = String(Math.floor(xp / 300) + 1).padStart(2, "0");
  $("completed").textContent = completed;
  $("progress-bar").style.width = `${((current + 1) / missions.length) * 100}%`;
  $("next").disabled = false;
}

$("next").addEventListener("click", () => {
  if (!answered) return;

  if (current < missions.length - 1) {
    current++;
    renderMission();
  } else {
    $("question").textContent = "Mission terminée !";
    $("answers").replaceChildren();
    $("feedback").textContent = `Tu as gagné ${xp} XP et terminé ${completed} missions avec succès.`;
    $("next").classList.add("hidden");
    $("restart").classList.remove("hidden");
    $("progress-bar").style.width = "100%";
    $("mission-count").textContent = "COMPLETED";
  }
});

$("restart").addEventListener("click", () => {
  current = 0;
  xp = 0;
  completed = 0;
  $("xp").textContent = "0";
  $("level").textContent = "01";
  $("completed").textContent = "0";
  renderMission();
});

renderMission();
