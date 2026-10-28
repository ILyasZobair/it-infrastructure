
const $ = (selector) => document.querySelector(selector);

const labData = {
  network: {
    title: "Cisco Network Lab",
    description: "Apprenez les bases de l'adressage IP et du diagnostic réseau.",
    question: "Quelle commande Linux permet de vérifier les adresses IP des interfaces ?",
    options: ["ip addr", "mkdir network", "show users"],
    answer: 0,
    explanation: "La commande ip addr affiche les interfaces réseau et leurs adresses IP."
  },
  windows: {
    title: "Windows Server Lab",
    description: "Découvrez les rôles essentiels d'un serveur Windows.",
    question: "Quel service permet de gérer les utilisateurs et les groupes d'un domaine ?",
    options: ["Active Directory", "Paint", "Gestionnaire de tâches"],
    answer: 0,
    explanation: "Active Directory Domain Services centralise les comptes et les ressources d'un domaine."
  },
  linux: {
    title: "Linux Command Center",
    description: "Testez vos connaissances sur les commandes Linux.",
    question: "Quelle commande affiche le répertoire courant ?",
    options: ["pwd", "touch", "clear"],
    answer: 0,
    explanation: "pwd signifie print working directory et affiche le chemin courant."
  },
  virtual: {
    title: "Virtualization Lab",
    description: "Comprenez le rôle de l'hyperviseur et des machines virtuelles.",
    question: "À quoi sert un hyperviseur ?",
    options: [
      "À créer et gérer des machines virtuelles",
      "À remplacer une adresse IP",
      "À chiffrer automatiquement tous les fichiers"
    ],
    answer: 0,
    explanation: "Un hyperviseur permet de créer et d'exécuter plusieurs machines virtuelles sur un hôte."
  }
};

const missionData = {
  ip: {
    title: "Mission 01 — Configuration IP",
    question: "Un PC possède l'adresse 192.168.1.25/24. Quelle passerelle est cohérente avec un routeur configuré en 192.168.1.1/24 ?",
    options: ["192.168.1.1", "192.168.2.1", "255.255.255.0"],
    answer: 0,
    xp: 100
  },
  dns: {
    title: "Mission 02 — Diagnostic DNS",
    question: "Quelle commande Linux permet d'interroger un serveur DNS ?",
    options: ["dig example.com", "mkdir example.com", "chmod dns"],
    answer: 0,
    xp: 150
  },
  permissions: {
    title: "Mission 03 — Permissions Linux",
    question: "Quelle commande donne au propriétaire les droits de lecture et d'écriture, et retire les droits aux autres ?",
    options: ["chmod 600 fichier.txt", "ping 600", "ip addr 600"],
    answer: 0,
    xp: 120
  }
};

let xp = Number(localStorage.getItem("infraLabXP")) || 0;
let completed = JSON.parse(localStorage.getItem("infraLabCompleted") || "[]");
let currentChallenge = null;
let answered = false;

function updateProgress() {
  $("#xp").textContent = String(xp).padStart(3, "0");
  $("#level").textContent = String(Math.floor(xp / 250) + 1).padStart(2, "0");
  $("#rank").textContent = xp >= 500 ? "JUNIOR ENGINEER" : xp >= 250 ? "IT TECHNICIAN" : "IT TRAINEE";
  document.querySelectorAll("[data-mission]").forEach(button => {
    if (completed.includes(button.dataset.mission)) {
      button.textContent = "✓ TERMINÉ";
      button.disabled = true;
    }
  });
  $("#mission-count").textContent = String(6 - completed.length).padStart(2, "0");
}

function openChallenge(data, key, isMission) {
  currentChallenge = { ...data, key, isMission };
  answered = false;
  $("#dialog-title").textContent = data.title;
  $("#dialog-description").textContent = isMission ? "Mission technique : choisissez la meilleure réponse." : data.description;
  $("#dialog-body").innerHTML = `<p>${data.question}</p>` + data.options.map((option, index) =>
    `<button class="challenge-option" data-option="${index}">${option}</button>`
  ).join("") + `<p id="challenge-feedback" aria-live="polite"></p>`;
  $("#dialog-action").textContent = "Vérifier la réponse";
  $("#dialog-action").disabled = false;
  $("#lab-dialog").showModal();

  $("#dialog-body").querySelectorAll("[data-option]").forEach(button => {
    button.addEventListener("click", () => {
      if (answered) return;
      $("#dialog-body").querySelectorAll("[data-option]").forEach(b => b.classList.remove("correct", "wrong"));
      button.dataset.selected = "true";
      button.style.borderColor = "var(--cyan)";
      $("#challenge-feedback").textContent = "Réponse sélectionnée. Cliquez sur Vérifier la réponse.";
    });
  });
}

function checkChallenge() {
  if (!currentChallenge || answered) {
    $("#lab-dialog").close();
    return;
  }
  const selected = $("#dialog-body [data-selected='true']");
  if (!selected) {
    $("#challenge-feedback").textContent = "Choisissez une réponse avant de continuer.";
    return;
  }
  answered = true;
  const isCorrect = Number(selected.dataset.option) === currentChallenge.answer;
  selected.classList.add(isCorrect ? "correct" : "wrong");

  if (isCorrect) {
    $("#challenge-feedback").innerHTML = `<span class="success">Bonne réponse ! +${currentChallenge.xp || 50} XP</span>`;
    if (currentChallenge.isMission && !completed.includes(currentChallenge.key)) {
      xp += currentChallenge.xp;
      completed.push(currentChallenge.key);
      localStorage.setItem("infraLabXP", xp);
      localStorage.setItem("infraLabCompleted", JSON.stringify(completed));
      updateProgress();
    } else if (!currentChallenge.isMission) {
      xp += 50;
      localStorage.setItem("infraLabXP", xp);
      updateProgress();
    }
    $("#dialog-action").textContent = "Terminer";
  } else {
    $("#challenge-feedback").innerHTML = `<span class="error">Pas encore. Relisez la question et réessayez lors d'une nouvelle tentative.</span>`;
    $("#dialog-action").textContent = "Fermer";
  }
}

document.querySelectorAll("[data-lab]").forEach(button => {
  button.addEventListener("click", () => {
    openChallenge(labData[button.dataset.lab], button.dataset.lab, false);
  });
});

document.querySelectorAll("[data-mission]").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.mission;
    if (!completed.includes(key)) openChallenge(missionData[key], key, true);
  });
});

$("#dialog-action").addEventListener("click", checkChallenge);
$("#dialog-close").addEventListener("click", () => $("#lab-dialog").close());
$("#year").textContent = new Date().getFullYear();

const terminalOutput = $("#terminal-output");
const commandInput = $("#terminal-input");

function terminalLine(text, className = "") {
  const p = document.createElement("p");
  p.textContent = text;
  if (className) p.className = className;
  terminalOutput.appendChild(p);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

const commands = {
  help: [
    "Commandes disponibles :",
    "help  — afficher les commandes",
    "ip addr — afficher une IP simulée",
    "ping 8.8.8.8 — simuler un test de connectivité",
    "traceroute example.com — simuler un chemin réseau",
    "hostname — afficher le nom de la machine",
    "clear — effacer la console"
  ],
  "ip addr": ["eth0: UP", "inet 192.168.1.20/24", "gateway: 192.168.1.1"],
  "ping 8.8.8.8": ["PING 8.8.8.8 (8.8.8.8)", "64 bytes from 8.8.8.8: time=12 ms", "Simulation terminée : 1 paquet envoyé, 1 reçu."],
  "traceroute example.com": ["1  192.168.1.1  2 ms", "2  10.0.0.1  8 ms", "3  example.com  15 ms", "Chemin simulé terminé."],
  hostname: ["infra-lab-client"]
};

$("#terminal-form").addEventListener("submit", event => {
  event.preventDefault();
  const command = commandInput.value.trim().toLowerCase();
  if (!command) return;
  terminalLine(`student@infra-lab:~$ ${command}`);
  if (command === "clear") {
    terminalOutput.replaceChildren();
  } else if (commands[command]) {
    commands[command].forEach(line => terminalLine(line, "success"));
  } else {
    terminalLine(`Commande inconnue : ${command}. Tapez help.`, "error");
  }
  commandInput.value = "";
});

$("#clear-terminal").addEventListener("click", () => terminalOutput.replaceChildren());

updateProgress();
