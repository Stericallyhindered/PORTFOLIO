import 'package:flutter/material.dart';

class E85CalculatorPage extends StatefulWidget {
  const E85CalculatorPage({Key? key}) : super(key: key);

  @override
  _E85CalculatorPageState createState() => _E85CalculatorPageState();
}

class _E85CalculatorPageState extends State<E85CalculatorPage> {
  double e85Gallons = 0.0; // Gallons of E85
  double e85Percentage = 10.0; // % Ethanol in E85
  double e10Gallons = 0.0; // Gallons of E10
  double e10Percentage = 85.0; // % Ethanol in E10
  double totalGallons = 0.0; // Total gallons of the mixture
  double totalEthanolPercentage = 0.0; // Resulting % Ethanol

  final TextEditingController _e85GallonsController = TextEditingController();
  final TextEditingController _e85PercentageController = TextEditingController();
  final TextEditingController _e10GallonsController = TextEditingController();
  final TextEditingController _e10PercentageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _e85GallonsController.text = e85Gallons.toString();
    _e85PercentageController.text = e85Percentage.toString();
    _e10GallonsController.text = e10Gallons.toString();
    _e10PercentageController.text = e10Percentage.toString();
  }

  void calculateTotal() {
    // Calculate total gallons and resulting ethanol percentage
    double totalEthanol = (e85Gallons * (e85Percentage / 100)) + (e10Gallons * (e10Percentage / 100));
    totalGallons = e85Gallons + e10Gallons;

    // Avoid division by zero
    if (totalGallons > 0) {
      totalEthanolPercentage = (totalEthanol / totalGallons) * 100;
    } else {
      totalEthanolPercentage = 0.0;
    }

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ethanol Calculator'),
        backgroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Fuel Mix (ex. E85)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 10),

            // E85 Inputs
            _buildInputField("Gallons (E85)", _e85GallonsController, (value) {
              e85Gallons = double.tryParse(value) ?? 0.0;
              calculateTotal();
            }),
            _buildInputField("Ethanol % (E85)", _e85PercentageController, (value) {
              e85Percentage = double.tryParse(value) ?? 10.0;
              calculateTotal();
            }),

            const SizedBox(height: 20),
            const Text('Fuel Mix (ex. E10)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 10),

            // E10 Inputs
            _buildInputField("Gallons (E10)", _e10GallonsController, (value) {
              e10Gallons = double.tryParse(value) ?? 0.0;
              calculateTotal();
            }),
            _buildInputField("Ethanol % (E10)", _e10PercentageController, (value) {
              e10Percentage = double.tryParse(value) ?? 85.0;
              calculateTotal();
            }),

            const SizedBox(height: 20),
            const Text('Results', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 10),
            Text('Total Gallons: ${totalGallons.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white)),
            Text('Resulting % Ethanol: ${totalEthanolPercentage.toStringAsFixed(2)}%', style: const TextStyle(color: Colors.white)),
            Text('Or E${(totalEthanolPercentage).toStringAsFixed(0)}', style: const TextStyle(color: Colors.white)),
          ],
        ),
      ),
      backgroundColor: Colors.black,
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 16, color: Colors.white)),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          onChanged: onChanged,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            fillColor: Colors.white,
            filled: true,
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }
}
