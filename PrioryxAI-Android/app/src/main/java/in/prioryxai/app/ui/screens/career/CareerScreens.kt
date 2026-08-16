package in.prioryxai.app.ui.screens.career

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.core.models.CodingProfile
import in.prioryxai.app.core.models.Job
import in.prioryxai.app.core.models.Project
import in.prioryxai.app.ui.components.*
import in.prioryxai.app.ui.screens.profile.ContributionGraph
import in.prioryxai.app.ui.theme.BrandAmber
import in.prioryxai.app.ui.theme.BrandViolet

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumeScreen() {
  val extractedSkills = listOf("React", "TypeScript", "Go", "PostgreSQL", "Docker", "REST APIs", "Git")
  val missingSkills = listOf("Redis Caching", "Kafka", "Kubernetes", "CI/CD")

  Scaffold(
    topBar = { TopAppBar(title = { Text("Resume Intelligence 📄", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      item {
        PXCard(cornerRadius = 22.dp, padding = 18.dp) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            ScoreRing(score = 82, size = 80.dp, label = "ATS")
            Spacer(Modifier.width(16.dp))
            Column {
              Text("Strong Tier 1 Profile", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              Text("Evaluated against 1,200+ SDE job descriptions at top product firms.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
          }
        }
      }

      item {
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Text("DETECTED TECHNICAL SKILLS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
          Spacer(Modifier.height(10.dp))
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(extractedSkills) { skill ->
              PXBadge(text = skill)
            }
          }
        }
      }

      item {
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Text("RECOMMENDED MISSING KEYWORDS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = BrandAmber)
          Spacer(Modifier.height(10.dp))
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(missingSkills) { skill ->
              PXBadge(text = "+ $skill", backgroundColor = BrandAmber.copy(alpha = 0.15f), textColor = BrandAmber)
            }
          }
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FoundryScreen() {
  val projects = listOf(
    Project("1", "High-Throughput Distributed Rate Limiter", "Token Bucket & Redis clustering in Go with Docker.", "Intermediate", listOf("Go", "Redis", "Docker"), 3, 6),
    Project("2", "Real-Time Collaborative Markdown Editor", "Multiplayer document sync using CRDT & WebSockets.", "Advanced", listOf("TypeScript", "Node.js", "CRDT"), 1, 6)
  )

  Scaffold(
    topBar = { TopAppBar(title = { Text("Project Foundry 🔨", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      items(projects) { p ->
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            PXBadge(text = p.tier.uppercase())
            Text("Phase ${p.currentPhase}/${p.totalPhases}", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
          }
          Spacer(Modifier.height(8.dp))
          Text(p.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
          Spacer(Modifier.height(4.dp))
          Text(p.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
          Spacer(Modifier.height(12.dp))
          LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(p.techStack) { tech ->
              Box(
                modifier = Modifier
                  .clip(RoundedCornerShape(6.dp))
                  .background(MaterialTheme.colorScheme.surfaceVariant)
                  .padding(horizontal = 8.dp, vertical = 4.dp)
              ) {
                Text(tech, style = MaterialTheme.typography.labelSmall)
              }
            }
          }
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UnifiedCodingScreen() {
  val profiles = listOf(
    CodingProfile("LeetCode", "yug_dev", 248, 1742, true),
    CodingProfile("HackerRank", "yugendhar", 85, 1420, true),
    CodingProfile("CodeChef", null, 0, 0, false)
  )

  Scaffold(
    topBar = { TopAppBar(title = { Text("Coding Profiles 💻", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      item {
        PXCard(cornerRadius = 22.dp, padding = 18.dp) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            ScoreRing(score = 72, size = 80.dp, label = "Index")
            Spacer(Modifier.width(16.dp))
            Column {
              Text("333 Solved", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
              Text("Top 12% among Indian Students", style = MaterialTheme.typography.bodySmall, color = BrandViolet, fontWeight = FontWeight.SemiBold)
            }
          }
        }
      }

      items(profiles) { p ->
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
              Text(p.platform, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              if (p.isConnected && p.username != null) {
                Text("@${p.username}", color = BrandViolet, style = MaterialTheme.typography.labelSmall)
                Text("${p.problemsSolved} solved • Rating ${p.rating}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
              } else {
                Text("Not connected", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
              }
            }

            if (p.isConnected) {
              ScoreRing(score = (p.problemsSolved / 3).coerceIn(0, 100), size = 48.dp)
            } else {
              PXButton(text = "Connect", onClick = {}, height = 36.dp, modifier = Modifier.width(90.dp))
            }
          }
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GitHubIntelligenceScreen() {
  Scaffold(
    topBar = { TopAppBar(title = { Text("GitHub Intelligence 🔑", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      item {
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Text("🐙", fontSize = 36.sp)
            Spacer(Modifier.width(12.dp))
            Column {
              Text("@codewithyug06", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              Text("Verified Developer Profile", color = BrandViolet, style = MaterialTheme.typography.labelSmall)
            }
          }
        }
      }

      item { ContributionGraph(streakDays = 14) }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobMarketScreen() {
  val jobs = listOf(
    Job("1", "SDE Intern (Backend / Go)", "Razorpay", "Bengaluru", "₹45,000 / month", 92, listOf("Go", "PostgreSQL", "Redis")),
    Job("2", "Junior Fullstack Engineer", "CRED", "Bengaluru", "18 - 24 LPA", 84, listOf("React", "TypeScript", "Node.js"))
  )

  Scaffold(
    topBar = { TopAppBar(title = { Text("Job Market 💼", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
      items(jobs) { job ->
        PXCard(cornerRadius = 20.dp, padding = 16.dp) {
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
              Text(job.role, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
              Text("${job.company} • ${job.location}", color = BrandViolet, style = MaterialTheme.typography.labelSmall)
              Text(job.stipendOrCtc, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            ScoreRing(score = job.matchScore, size = 50.dp, label = "Match")
          }
          Spacer(Modifier.height(12.dp))
          PXButton(text = "Apply Now →", onClick = {}, height = 38.dp)
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PeerCollabScreen() {
  Scaffold(
    topBar = { TopAppBar(title = { Text("Peer Collab 👥", fontWeight = FontWeight.Bold) }) }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      item {
        PXCard(cornerRadius = 20.dp, padding = 18.dp) {
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
              Text("YOUR CONNECT CODE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = BrandViolet)
              Text("PRX-8492", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }
            PXButton(text = "Copy Code", onClick = {}, height = 36.dp, modifier = Modifier.width(100.dp))
          }
        }
      }
    }
  }
}
